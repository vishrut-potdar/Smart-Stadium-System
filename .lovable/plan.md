# Arena v5 — Plan

Six workstreams. All frontend styling stays; we add a real backend, harden flows, and expand tests.

## 1. Lovable Cloud + auth + cross-device persistence

Enable Lovable Cloud (Supabase under the hood) and add email/password + Google sign-in.

Tables (all with GRANTs + RLS):

- `profiles` (id → auth.users, display_name)
- `user_roles` (id, user_id, role enum `admin`|`user`) + `has_role()` security-definer fn
- `predictions` (id, user_id, match_id, pick_home, pick_away, submitted_at)
- `leaderboard_scores` (user_id PK, points, correct, streak, best, updated_at) — recomputed via server fn
- `nfc_cache` (user_id, key, payload jsonb, updated_at) — per-user offline map cache
- `admin_fixtures`, `admin_standings`, `admin_timeline`, `admin_bracket`, `admin_broadcasts` — admin-writable via `has_role('admin')`, world-readable

Server functions in `src/lib/*.functions.ts`:

- `savePrediction`, `listMyPredictions`, `scoreMyPredictions`
- `syncLeaderboard`, `getLeaderboard`
- `saveNfcCache`, `loadNfcCache`
- Admin: `upsertFixture`, `upsertStanding`, `appendTimeline`, `updateBracketMatch`, `broadcastAlert` — all gated by `requireSupabaseAuth` + `has_role('admin')` check via `context.supabase`

Migrate `src/lib/leaderboard.ts`, `offline-cache.ts`, `admin-store.ts` to hydrate from Cloud when signed-in with localStorage fallback for anon.

## 2. Auth-gated /admin

Move `src/routes/admin.tsx` under `src/routes/_authenticated/admin.tsx`. Inside, check `has_role('admin')` server-side; render "Not authorized" panel otherwise. Remove the shared `arena-admin` token flow (add note in memory: never re-add client-token admin gate).

## 3. Service worker for offline NFC + Alerts

Add `vite-plugin-pwa` with `generateSW`, `registerType: "autoUpdate"`, `devOptions.enabled: false`, `injectRegister: null`. Wrapper module `src/lib/register-sw.ts` refuses to register in preview/iframe/dev per skill/pwa rules.

- Precache: `/nfc`, `/alerts` shells + hashed assets, stadium-seats image
- Runtime: `NetworkFirst` for HTML navigations, `CacheFirst` for `/assets/*`, `StaleWhileRevalidate` for `/api/live/*`
- Add "Offline ready" indicator on both routes

## 4. Predictions validation + scoring explanations

In `src/routes/index.tsx` predictions card:

- Zod schema: scores 0–15, both required, deadline check (fixture kickoff not passed)
- Inline error toasts, disabled submit until valid
- New `ScoringRulesDialog` explaining: winner +10, exact +5, poll majority +3, streak bonus +2, per-match breakdown after resolution
- Per-match "Why this score?" popover on leaderboard/home showing awarded points math

## 5. Expanded GenAI features

Using Lovable AI Gateway (`google/gemini-2.5-flash` default):

- **Match preview generator** — server fn `generateMatchPreview({fixtureId, lang})` returns structured tactical brief, key players, prediction. Shown on Home per fixture.
- **Post-match recap** — auto recap when fixture resolved
- **Smart alert summarizer** — condenses last N alerts into a 2-line digest for the Alerts header
- **AI concierge upgrades** — assistant already exists; add tool-calling for `find_seat`, `nearest_exit`, `next_fixture` using structured outputs
- **Personalized fan digest** — daily card on Home based on user's team follows + predictions
  All localized via existing `i18n` language switcher.

## 6. Playwright coverage

New/expanded specs in `tests/e2e/`:

- `alerts-feed.spec.ts` — feed renders, admin broadcast appears, notification toggle: default → prompt → granted (mock Notification), denied path shows fallback banner, rate-limit (simulate 429 from `/api/live/alerts`) shows retry UI
- `predictions.spec.ts` — invalid picks blocked, scoring explanation dialog opens, resolved match shows breakdown
- Extend `admin` spec — unauthenticated redirect to /auth, non-admin sees "Not authorized", admin can edit
- `offline-sw.spec.ts` — with SW registered, go offline, /nfc and /alerts still render from cache

## Technical notes

- Enable Lovable Cloud first (unlocks Supabase tooling).
- Google OAuth via `lovable.auth.signInWithOAuth('google', …)`; call `supabase--configure_social_auth` for `google` in the same turn.
- Admin bootstrap: first migration inserts current signed-in user? Not possible — instead expose a one-time "claim admin" server fn guarded by env `ADMIN_BOOTSTRAP_TOKEN` (generated secret) that grants the caller `admin` role if no admin exists.
- Keep existing UI shell/design tokens; no visual redesign.

## Out of scope

- Native push (already shipped in v4, unchanged)
- New route beyond `_authenticated/admin` move
- Migrating existing anon localStorage predictions history (fresh start on sign-in; note in UI)

Confirm to proceed and I'll enable Lovable Cloud and start with workstream 1.
