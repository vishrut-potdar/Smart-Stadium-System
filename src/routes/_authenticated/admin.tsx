/* eslint-disable @typescript-eslint/no-explicit-any, no-empty, react-hooks/exhaustive-deps */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, PanelHeader, Icon } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  isAdmin as isAdminFn,
  claimAdmin,
  broadcastAlert,
  listBroadcasts,
} from "@/lib/admin.functions";
import { useAdmin, type Fixture, type Standing } from "@/lib/admin-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Arena" },
      {
        name: "description",
        content: "Manage fixtures, standings, timeline, bracket and broadcasts.",
      },
    ],
  }),
  component: AdminPage,
});

type Tab = "fixtures" | "standings" | "timeline" | "bracket" | "broadcast";
const TABS: { id: Tab; label: string }[] = [
  { id: "fixtures", label: "Fixtures" },
  { id: "standings", label: "Standings" },
  { id: "timeline", label: "Timeline" },
  { id: "bracket", label: "Bracket" },
  { id: "broadcast", label: "Broadcast" },
];

function AdminPage() {
  const navigate = useNavigate();
  const check = useServerFn(isAdminFn);
  const claim = useServerFn(claimAdmin);
  const [status, setStatus] = useState<"loading" | "admin" | "not-admin">("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await check();
      setStatus(r.isAdmin ? "admin" : "not-admin");
    } catch {
      setStatus("not-admin");
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    refresh();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (status === "loading") {
    return (
      <>
        <PanelHeader
          eyebrow="Admin"
          title="Verifying access"
          desc="Checking your admin permissions…"
        />
        <Card>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </Card>
      </>
    );
  }

  if (status === "not-admin") {
    return (
      <>
        <PanelHeader
          eyebrow="Admin"
          title="Not authorized"
          desc="Only admins can manage fixtures, standings and broadcasts."
        />
        <Card data-testid="admin-forbidden" className="max-w-md">
          <p className="text-sm">
            Signed in as <span className="font-medium">{email ?? "(unknown)"}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            If no admin exists yet you can claim the first admin role (one-time bootstrap).
          </p>
          <div className="mt-4 flex gap-2">
            <button
              data-testid="claim-admin"
              onClick={async () => {
                setClaimError(null);
                try {
                  const r = await claim();
                  if (r.claimed) await refresh();
                  else setClaimError("An admin already exists — ask them to grant you the role.");
                } catch (e: any) {
                  setClaimError(e?.message ?? "Could not claim admin");
                }
              }}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Claim first admin
            </button>
            <button
              onClick={signOut}
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              Sign out
            </button>
          </div>
          {claimError && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {claimError}
            </p>
          )}
        </Card>
      </>
    );
  }

  return <Console signOut={signOut} email={email} />;
}

function Console({ signOut, email }: { signOut: () => void; email: string | null }) {
  const [tab, setTab] = useState<Tab>("broadcast");
  const { state, update, reset } = useAdmin();
  return (
    <>
      <PanelHeader
        eyebrow="Admin"
        title="Control room"
        desc="Local edits update the dashboard instantly; broadcasts persist to the database and sync across devices."
      />
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Signed in as <span className="font-medium text-foreground">{email ?? "admin"}</span>
        </span>
        <button
          onClick={signOut}
          className="rounded-full border border-border px-3 py-1 hover:bg-secondary/60"
        >
          Sign out
        </button>
      </div>
      <div
        role="tablist"
        aria-label="Admin sections"
        className="mb-6 flex flex-wrap gap-1.5 rounded-full bg-secondary p-1.5"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-background",
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={reset}
          className="ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-background"
        >
          Reset local
        </button>
      </div>

      {tab === "fixtures" && <FixturesTab state={state} update={update} />}
      {tab === "standings" && <StandingsTab state={state} update={update} />}
      {tab === "timeline" && <TimelineTab state={state} update={update} />}
      {tab === "bracket" && <BracketTab state={state} update={update} />}
      {tab === "broadcast" && <BroadcastTab />}
    </>
  );
}

type UpdateFn = ReturnType<typeof useAdmin>["update"];

function FixturesTab({
  state,
  update,
}: {
  state: ReturnType<typeof useAdmin>["state"];
  update: UpdateFn;
}) {
  return (
    <Card>
      <h2 className="text-sm font-semibold">Fixtures</h2>
      <ul className="mt-4 space-y-3">
        {state.fixtures.map((f: Fixture, i) => (
          <li
            key={i}
            className="grid gap-2 rounded-2xl bg-secondary/50 p-3 sm:grid-cols-6"
            data-testid={`fixture-${i}`}
          >
            <input
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={f.day}
              aria-label="Day"
              onChange={(e) =>
                update((s) => {
                  s.fixtures[i] = { ...f, day: e.target.value };
                  return { ...s };
                })
              }
            />
            <input
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={f.time}
              aria-label="Time"
              onChange={(e) =>
                update((s) => {
                  s.fixtures[i] = { ...f, time: e.target.value };
                  return { ...s };
                })
              }
            />
            <input
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={f.home}
              aria-label="Home"
              onChange={(e) =>
                update((s) => {
                  s.fixtures[i] = { ...f, home: e.target.value };
                  return { ...s };
                })
              }
            />
            <input
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={f.away}
              aria-label="Away"
              onChange={(e) =>
                update((s) => {
                  s.fixtures[i] = { ...f, away: e.target.value };
                  return { ...s };
                })
              }
            />
            <input
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              value={f.venue}
              aria-label="Venue"
              onChange={(e) =>
                update((s) => {
                  s.fixtures[i] = { ...f, venue: e.target.value };
                  return { ...s };
                })
              }
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StandingsTab({
  state,
  update,
}: {
  state: ReturnType<typeof useAdmin>["state"];
  update: UpdateFn;
}) {
  const cols = [
    { k: "p", label: "P" },
    { k: "w", label: "W" },
    { k: "d", label: "D" },
    { k: "l", label: "L" },
    { k: "gf", label: "GF" },
    { k: "ga", label: "GA" },
    { k: "pts", label: "Pts" },
  ] as const;
  return (
    <Card>
      <h2 className="text-sm font-semibold">Group F standings</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2 text-left">Team</th>
              {cols.map((c) => (
                <th key={c.k} className="px-2 text-right">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.standings.map((r: Standing, i) => (
              <tr key={r.team} className="border-t border-border/60" data-testid={`standing-${i}`}>
                <td className="py-2 font-medium">{r.team}</td>
                {cols.map((c) => (
                  <td key={c.k} className="px-2 text-right">
                    <input
                      type="number"
                      className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm"
                      value={r[c.k]}
                      aria-label={`${r.team} ${c.label}`}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        update((s) => {
                          s.standings[i] = { ...r, [c.k]: val } as Standing;
                          return { ...s };
                        });
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TimelineTab({
  state,
  update,
}: {
  state: ReturnType<typeof useAdmin>["state"];
  update: UpdateFn;
}) {
  const [minute, setMinute] = useState(70);
  const [type, setType] = useState<"goal" | "yellow" | "red" | "sub" | "var" | "key">("goal");
  const [team, setTeam] = useState<"ARG" | "FRA">("ARG");
  const [title, setTitle] = useState("GOAL · New scorer");
  const [detail, setDetail] = useState("");
  return (
    <Card>
      <h2 className="text-sm font-semibold">Live timeline</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-6">
        <input
          type="number"
          value={minute}
          aria-label="Minute"
          onChange={(e) => setMinute(Number(e.target.value))}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          {["goal", "yellow", "red", "sub", "var", "key"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value as "ARG" | "FRA")}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="ARG">ARG</option>
          <option value="FRA">FRA</option>
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <button
          data-testid="timeline-add"
          onClick={() =>
            update((s) => ({
              ...s,
              timeline: [...s.timeline, { minute, type, team, title, detail }],
            }))
          }
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Append
        </button>
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-6"
        />
      </div>
      <ul className="mt-6 space-y-1 text-sm">
        {[...state.timeline].reverse().map((ev, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2">
            <span className="w-10 text-xs font-semibold tabular-nums">{ev.minute}′</span>
            <span className="pill bg-background text-[10px]">{ev.type}</span>
            <span className="flex-1">{ev.title}</span>
            {ev.team && <span className="text-xs text-muted-foreground">{ev.team}</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function BracketTab({
  state,
  update,
}: {
  state: ReturnType<typeof useAdmin>["state"];
  update: UpdateFn;
}) {
  const rounds = ["R16", "QF", "SF", "F"] as const;
  return (
    <div className="grid gap-4">
      {rounds.map((rd) => (
        <Card key={rd}>
          <h2 className="text-sm font-semibold">Round · {rd}</h2>
          <ul className="mt-3 space-y-2">
            {state.bracket[rd].map((m, i) => (
              <li
                key={m.id}
                className="grid gap-2 rounded-xl bg-secondary/50 p-2 sm:grid-cols-5 sm:items-center"
              >
                <input
                  value={m.home ?? ""}
                  aria-label="Home"
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  onChange={(e) =>
                    update((s) => {
                      s.bracket[rd][i] = { ...m, home: e.target.value };
                      return { ...s };
                    })
                  }
                />
                <input
                  value={m.away ?? ""}
                  aria-label="Away"
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  onChange={(e) =>
                    update((s) => {
                      s.bracket[rd][i] = { ...m, away: e.target.value };
                      return { ...s };
                    })
                  }
                />
                <input
                  type="number"
                  value={m.homeScore ?? 0}
                  aria-label="Home score"
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  onChange={(e) =>
                    update((s) => {
                      s.bracket[rd][i] = { ...m, homeScore: Number(e.target.value) };
                      return { ...s };
                    })
                  }
                />
                <input
                  type="number"
                  value={m.awayScore ?? 0}
                  aria-label="Away score"
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  onChange={(e) =>
                    update((s) => {
                      s.bracket[rd][i] = { ...m, awayScore: Number(e.target.value) };
                      return { ...s };
                    })
                  }
                />
                <input
                  value={m.winner ?? ""}
                  aria-label="Winner"
                  placeholder="Winner"
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  onChange={(e) =>
                    update((s) => {
                      s.bracket[rd][i] = { ...m, winner: e.target.value.toUpperCase() };
                      return { ...s };
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function BroadcastTab() {
  const broadcast = useServerFn(broadcastAlert);
  const list = useServerFn(listBroadcasts);
  const [title, setTitle] = useState("GOAL! New scorer");
  const [body, setBody] = useState("Live from the pitch.");
  const [tag, setTag] = useState("GOAL");
  const [tone, setTone] = useState<"primary" | "accent" | "warning" | "destructive">("destructive");
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await list();
      setItems(r.broadcasts ?? []);
    } catch {}
  };
  useEffect(() => {
    refresh();
  }, []);

  const send = async () => {
    setStatus(null);
    try {
      await broadcast({ data: { tag, title, body, tone } });
      setStatus("Broadcast published to the alerts feed.");
      await refresh();
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to broadcast");
    }
  };

  return (
    <Card>
      <h2 className="text-sm font-semibold">Broadcast alert</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Pushes to the alerts feed for all fans across all devices. Persisted in the database.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          {[
            "GOAL",
            "VAR",
            "Kick-off",
            "Half-time",
            "Full-time",
            "Safety",
            "Weather",
            "Schedule",
          ].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as any)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          {["destructive", "warning", "accent", "primary"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-3"
        />
        <button
          data-testid="broadcast-send"
          onClick={send}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Broadcast
        </button>
      </div>
      {status && (
        <p
          data-testid="broadcast-status"
          className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary"
        >
          {status}
        </p>
      )}
      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recent broadcasts
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        {items.length === 0 && (
          <li className="text-xs text-muted-foreground">Nothing broadcast yet.</li>
        )}
        {items.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2">
            <Icon.Bell className="h-4 w-4 text-muted-foreground" />
            <span className="pill bg-background text-[10px]">{a.tag}</span>
            <span className="flex-1">{a.title}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(a.created_at).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
