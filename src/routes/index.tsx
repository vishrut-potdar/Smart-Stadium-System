import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, Icon, LiveDot } from "@/components/AppShell";
import { FEATURES } from "@/components/icons";
import { useOrders } from "@/lib/orders-store";
import {
  MATCH,
  TOP_PERFORMER,
  MATCH_ANALYSIS,
  HEAD_TO_HEAD,
  POINTS_TABLE,
  STADIUM,
  FIXTURES,
  TIMELINE,
  BRACKET,
  type TimelineEvent,
  type BracketMatch,
} from "@/lib/match-data";
import { useT } from "@/lib/i18n";
import { generateBreakPoll } from "@/lib/polls.functions";
import { useLeaderboard, useMe } from "@/lib/leaderboard";
import { AiMatchPreview } from "@/components/AiMatchPreview";
import { PredictionForm } from "@/components/PredictionForm";
import { InteractiveStadiumMap } from "@/components/InteractiveStadiumMap";
import { StadiumCalendar } from "@/components/StadiumCalendar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arena — FIFA World Cup Fan Companion" },
      {
        name: "description",
        content:
          "Your GenAI FIFA World Cup companion — live scores, standings, wayfinding, crowd, alerts, translation & pre-order food.",
      },
      { property: "og:title", content: "Arena — FIFA World Cup Fan Companion" },
      {
        property: "og:description",
        content:
          "Your GenAI FIFA World Cup companion — live scores, standings, wayfinding, crowd, alerts, translation & pre-order food.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const orders = useOrders();
  const { t } = useT();
  const active = orders.filter((o) => o.stage !== "Picked up").length;
  const shortcuts = FEATURES.filter((f) => f.id !== "home");
  const [openQA, setOpenQA] = useState(false);

  const [liveMatch, setLiveMatch] = useState(MATCH);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/live/match-info");
        if (res.ok) {
          const data = await res.json();
          const m = data.liveMatch;
          setLiveMatch((prev) => ({
            ...prev,
            minute: m.minute,
            half: m.half,
            teamA: {
              ...prev.teamA,
              score: m.teamA.score,
              possession: m.teamA.possession,
              shots: m.teamA.shots,
            },
            teamB: {
              ...prev.teamB,
              score: m.teamB.score,
              possession: m.teamB.possession,
              shots: m.teamB.shots,
            },
          }));
        }
      } catch (e) {
        console.warn("Could not fetch homepage live scorecard, keeping cache.", e);
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="mb-8 rounded-3xl border border-border bg-surface-elevated p-8 shadow-[var(--shadow-glass)] sm:p-12">
        <div className="pill inline-flex bg-secondary text-muted-foreground">
          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-success" />
          FIFA World Cup · Powered by Generative AI
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
          The stadium, <span className="text-muted-foreground">reimagined for fans.</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Live scores, seat-side wayfinding and everything you need at the ground — one tap away.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/nfc"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try wayfinding <Icon.Arrow className="h-4 w-4" />
          </Link>
          <Link
            to="/food"
            className="inline-flex items-center rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Order food
          </Link>
        </div>
      </section>

      {/* SCORECARD — top of shortcuts */}
      <Scorecard match={liveMatch} />

      {/* QUICK ACCESS — collapsible */}
      <section className="mt-6" data-testid="quick-access">
        <button
          type="button"
          data-testid="quick-access-toggle"
          onClick={() => setOpenQA((v) => !v)}
          aria-expanded={openQA}
          aria-controls="quick-access-panel"
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface-elevated px-5 py-3.5 text-left shadow-[var(--shadow-glass)] transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-secondary">
              <Icon.Arrow
                className={"h-4 w-4 transition-transform " + (openQA ? "rotate-90" : "")}
              />
            </span>
            <span>
              <span className="block text-sm font-semibold">{t("Quick access")}</span>
              <span className="block text-[11px] text-muted-foreground">
                {shortcuts.length} features · wayfinding, help, food & more
              </span>
            </span>
          </span>
          <LiveDot />
        </button>
        {openQA && (
          <ul
            id="quick-access-panel"
            data-testid="quick-access-panel"
            role="list"
            className="mt-3 grid gap-2 rounded-2xl border border-border bg-surface-elevated p-2 shadow-[var(--shadow-glass)] sm:grid-cols-2 lg:grid-cols-3"
          >
            {shortcuts.map((f) => {
              const Ic = f.icon;
              return (
                <li key={f.id}>
                  <Link
                    to={f.to}
                    className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open ${f.title}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-secondary text-foreground group-hover:bg-background">
                        <Ic className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{t(f.label)}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {f.id === "food" && active > 0
                            ? `${active} active order${active > 1 ? "s" : ""}`
                            : "Tap to open"}
                        </span>
                      </span>
                    </span>
                    <Icon.Arrow className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Live match timeline */}
      <MatchTimeline minute={liveMatch.minute} />

      {/* AI-generated tactical match preview (Lovable AI Gateway) */}
      <AiMatchPreview home={MATCH.teamA.code} away={MATCH.teamB.code} venue={STADIUM.name} />

      {/* Fan predictions with validation + scoring dialog */}
      <PredictionForm
        matchId={`match-${MATCH.teamA.code}-${MATCH.teamB.code}`}
        home={MATCH.teamA.code}
        away={MATCH.teamB.code}
      />

      {/* AI fan poll during break */}
      <FanPoll />

      {/* Predictions leaderboard mini-card */}
      <LeaderboardMini />

      {/* Insight cards */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <TopPerformer />
        <MatchAnalysis />
        <TeamHistory />
        <StadiumInfo />
      </div>

      <InteractiveStadiumMap />
      <StadiumCalendar />

      <Fixtures />
      <PointsTable />
      <KnockoutBracket />
    </div>
  );
}

function Scorecard({ match }: { match: typeof MATCH }) {
  return (
    <Card
      className="overflow-hidden bg-primary text-primary-foreground"
      as="section"
      data-testid="scorecard"
    >
      <div className="flex items-center justify-between">
        <div className="pill inline-flex bg-white/10 text-white">
          <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live ·{" "}
          {match.minute}′
        </div>
        <span className="text-[11px] opacity-70">{match.competition}</span>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <TeamSide team={match.teamA} align="left" />
        <div className="text-center">
          <div className="text-4xl font-semibold tabular-nums sm:text-5xl">
            {match.teamA.score} <span className="opacity-40">·</span> {match.teamB.score}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wider opacity-70">{match.half}</div>
        </div>
        <TeamSide team={match.teamB} align="right" />
      </div>
      <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm">
        <div className="font-medium">{match.status}</div>
        <div className="mt-1 text-xs opacity-80">
          Possession {match.teamA.possession}% – {match.teamB.possession}% · Shots{" "}
          {match.teamA.shots}–{match.teamB.shots}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wider opacity-70">Goals</div>
        <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-3">
          {match.scorers.map((s, i) => (
            <li key={i} className="rounded-xl bg-white/10 px-3 py-2">
              <span className="font-medium">
                {s.minute}′ {s.player}
              </span>
              <span className="ml-1 text-xs opacity-70">
                ({s.team} · {s.type})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function TeamSide({ team, align }: { team: typeof MATCH.teamA; align: "left" | "right" }) {
  return (
    <div className={"flex-1 " + (align === "right" ? "text-right" : "text-left")}>
      <div className="text-xs opacity-70">{team.code}</div>
      <div className="text-lg font-semibold sm:text-xl">{team.name}</div>
    </div>
  );
}

function TopPerformer() {
  const p = TOP_PERFORMER;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Top performer</h3>
        <span className="pill bg-success/15 text-success">↑ In form</span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-primary text-lg font-semibold text-primary-foreground">
          {p.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <div className="text-base font-semibold">{p.name}</div>
          <div className="text-xs text-muted-foreground">{p.role}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-semibold tabular-nums">{p.stat}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Rating {p.rating}
          </div>
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
        {p.quote}
      </p>
    </Card>
  );
}

function MatchAnalysis() {
  const a = MATCH_ANALYSIS;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Match analysis</h3>
        <span className="pill bg-accent/15 text-accent">AI</span>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{MATCH.teamA.name} win probability</span>
          <span className="font-semibold text-foreground">{a.winProbA}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-accent" style={{ width: `${a.winProbA}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>W {a.winProbA}%</span>
          <span>D {a.drawProb}%</span>
          <span>L {a.winProbB}%</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-secondary/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            xG · {MATCH.teamA.code}
          </div>
          <div className="mt-1 font-semibold">{a.xgA}</div>
        </div>
        <div className="rounded-2xl bg-secondary/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            xG · {MATCH.teamB.code}
          </div>
          <div className="mt-1 font-semibold">{a.xgB}</div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{a.keyMoment}</p>
    </Card>
  );
}

function TeamHistory() {
  const h = HEAD_TO_HEAD;
  return (
    <Card>
      <h3 className="text-sm font-semibold">Head-to-head</h3>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-2xl bg-secondary/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {MATCH.teamA.code}
          </div>
          <div className="mt-1 text-xl font-semibold">{h.aWins}</div>
        </div>
        <div className="rounded-2xl bg-secondary/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Played</div>
          <div className="mt-1 text-xl font-semibold">{h.played}</div>
        </div>
        <div className="rounded-2xl bg-secondary/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {MATCH.teamB.code}
          </div>
          <div className="mt-1 text-xl font-semibold">{h.bWins}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Last 5
        </div>
        <div className="mt-2 flex gap-1.5">
          {h.last5.map((r, i) => (
            <span
              key={i}
              className={
                "grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold " +
                (r === "A"
                  ? "bg-accent text-accent-foreground"
                  : r === "D"
                    ? "bg-muted text-muted-foreground"
                    : "bg-destructive/15 text-destructive")
              }
            >
              {r === "A" ? "W" : r === "D" ? "D" : "L"}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function StadiumInfo() {
  const s = STADIUM;
  return (
    <Card>
      <h3 className="text-sm font-semibold">Stadium info</h3>
      <div className="mt-4 text-base font-semibold">{s.name}</div>
      <div className="text-xs text-muted-foreground">{s.city}</div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Row2 k="Capacity" v={s.capacity.toLocaleString()} />
        <Row2 k="Built" v={String(s.built)} />
        <Row2 k="Gates open" v={s.gatesOpen} />
        <Row2 k="Kick-off" v={s.matchStart} />
      </div>
      <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Pitch:</span> {s.pitch}
      </p>
    </Card>
  );
}

function Row2({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-1 font-medium">{v}</div>
    </div>
  );
}

function Fixtures() {
  return (
    <Card className="mt-4" data-testid="fixtures">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Upcoming fixtures</h3>
        <span className="text-[11px] text-muted-foreground">FIFA World Cup</span>
      </div>
      <ul className="mt-4 grid gap-2">
        {FIXTURES.map((f, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16">
                {f.day}
              </span>
              <span className="font-medium tabular-nums">{f.time}</span>
              <span className="font-semibold">{f.home}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="font-semibold">{f.away}</span>
              {f.live && <span className="pill bg-destructive/15 text-destructive">LIVE</span>}
            </div>
            <div className="hidden text-[11px] text-muted-foreground sm:block">
              {f.stage} · {f.venue}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PointsTable() {
  const { t } = useT();
  // Sort by tiebreakers: Pts, GD, GF
  const rows = [...POINTS_TABLE]
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  return (
    <Card className="mt-4" data-testid="standings">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("Group F standings")}</h3>
        <span className="text-[11px] text-muted-foreground">Tiebreakers: Pts · GD · GF · H2H</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2 text-left font-medium">Team</th>
              <th className="px-2 text-right font-medium">P</th>
              <th className="px-2 text-right font-medium">W</th>
              <th className="px-2 text-right font-medium">D</th>
              <th className="px-2 text-right font-medium">L</th>
              <th className="px-2 text-right font-medium">GF</th>
              <th className="px-2 text-right font-medium">GA</th>
              <th className="px-2 text-right font-medium">GD</th>
              <th className="px-2 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.team}
                className={"border-t border-border/60 " + (i < 2 ? "bg-success/[0.04]" : "")}
              >
                <td className="py-2.5">
                  <span className="mr-2 inline-block w-4 text-right text-xs text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <span
                    className={
                      "mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle " +
                      (i < 2 ? "bg-success" : i === 2 ? "bg-warning" : "bg-muted")
                    }
                    aria-hidden
                  />
                  <span className="font-medium">{r.team}</span>
                </td>
                <td className="px-2 text-right tabular-nums">{r.p}</td>
                <td className="px-2 text-right tabular-nums">{r.w}</td>
                <td className="px-2 text-right tabular-nums">{r.d}</td>
                <td className="px-2 text-right tabular-nums">{r.l}</td>
                <td className="px-2 text-right tabular-nums">{r.gf}</td>
                <td className="px-2 text-right tabular-nums">{r.ga}</td>
                <td
                  className={
                    "px-2 text-right tabular-nums " +
                    (r.gd > 0 ? "text-success" : r.gd < 0 ? "text-destructive" : "")
                  }
                >
                  {r.gd > 0 ? "+" : ""}
                  {r.gd}
                </td>
                <td className="px-2 text-right font-semibold tabular-nums">{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Advance to R16
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Play-off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" /> Eliminated
        </span>
      </div>
    </Card>
  );
}

/* ---------- Match timeline ---------- */

const TIMELINE_ICONS: Record<TimelineEvent["type"], string> = {
  goal: "⚽",
  yellow: "🟨",
  red: "🟥",
  sub: "⇄",
  var: "VAR",
  key: "★",
  kickoff: "▶",
  half: "HT",
  full: "FT",
};

function MatchTimeline({ minute }: { minute: number }) {
  const { t } = useT();
  return (
    <Card className="mt-6" as="section" data-testid="timeline">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("Live match timeline")}</h3>
        <span className="pill bg-destructive/15 text-destructive">LIVE · {minute}′</span>
      </div>
      <ol className="mt-5 relative border-l border-border/70 pl-5">
        {[...TIMELINE].reverse().map((e, i) => {
          const isGoal = e.type === "goal";
          const isCard = e.type === "yellow" || e.type === "red";
          return (
            <li key={i} className="relative pb-5 last:pb-0">
              <span
                className={
                  "absolute -left-[27px] grid h-6 w-6 place-items-center rounded-full border border-border bg-surface-elevated text-[10px] font-semibold " +
                  (isGoal ? "!bg-primary !text-primary-foreground border-primary" : "") +
                  (isCard ? " " : "")
                }
                aria-hidden
              >
                {TIMELINE_ICONS[e.type]}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold tabular-nums text-muted-foreground w-8">
                  {e.minute}′
                </span>
                <span className={"text-sm " + (isGoal ? "font-semibold" : "font-medium")}>
                  {e.title}
                </span>
                {e.team && (
                  <span className="pill bg-secondary text-[10px] text-muted-foreground">
                    {e.team}
                  </span>
                )}
              </div>
              {e.detail && <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ---------- AI fan poll ---------- */

type Poll = {
  question: string;
  options: { label: string; pct: number }[];
  prediction: string;
};

function FanPoll() {
  const { lang, t } = useT();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    setPicked(null);
    try {
      const res = await generateBreakPoll({ data: { lang } });
      setPoll(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load poll");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // reload on language switch so poll & prediction re-localize in real time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <Card className="mt-6" data-testid="fan-poll">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("Fan poll · Break time")}</h3>
        <div className="flex items-center gap-2">
          <span className="pill bg-accent/15 text-accent">AI</span>
          <button
            onClick={load}
            disabled={loading}
            data-testid="fan-poll-refresh"
            className="pill inline-flex items-center gap-1 bg-secondary text-muted-foreground hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            aria-label="Refresh poll"
          >
            <Icon.Arrow className={"h-3 w-3 " + (loading ? "animate-spin" : "")} /> New
          </button>
        </div>
      </div>

      {loading && !poll && <div className="mt-4 h-24 animate-pulse rounded-2xl bg-secondary/60" />}
      {err && (
        <p className="mt-3 rounded-2xl bg-destructive/10 p-3 text-xs text-destructive" role="alert">
          {err}
        </p>
      )}
      {poll && (
        <>
          <p className="mt-4 text-base font-medium" data-testid="fan-poll-question">
            {poll.question}
          </p>
          <ul className="mt-3 space-y-2" role="list">
            {poll.options.map((o, i) => {
              const chosen = picked === i;
              return (
                <li key={i}>
                  <button
                    onClick={() => setPicked(i)}
                    aria-pressed={chosen}
                    className={
                      "relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                      (chosen
                        ? "border-accent bg-accent/5"
                        : "border-border bg-secondary/40 hover:bg-secondary/60")
                    }
                  >
                    <span
                      className={
                        "absolute inset-y-0 left-0 " + (chosen ? "bg-accent/20" : "bg-secondary")
                      }
                      style={{ width: `${o.pct}%` }}
                      aria-hidden
                    />
                    <span className="relative flex items-center justify-between">
                      <span className="font-medium">{o.label}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">{o.pct}%</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p
            className="mt-4 rounded-2xl bg-primary/5 p-3 text-xs text-muted-foreground"
            data-testid="fan-poll-prediction"
          >
            <span className="mr-1 font-semibold text-primary">AI prediction:</span>
            {poll.prediction}
          </p>
        </>
      )}
    </Card>
  );
}

/* ---------- Knockout bracket ---------- */

function KnockoutBracket() {
  const { t } = useT();
  const rounds: { key: keyof typeof BRACKET; label: string }[] = [
    { key: "R16", label: "Round of 16" },
    { key: "QF", label: "Quarter-finals" },
    { key: "SF", label: "Semi-finals" },
    { key: "F", label: "Final" },
  ];
  return (
    <Card className="mt-4" data-testid="bracket">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("Knockout bracket")}</h3>
        <span className="text-[11px] text-muted-foreground">Updates as results come in</span>
      </div>
      <div className="mt-5 grid gap-4 overflow-x-auto md:grid-cols-4">
        {rounds.map((r) => (
          <div key={r.key} className="min-w-[180px]">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {r.label}
            </div>
            <ul className="space-y-2">
              {BRACKET[r.key].map((m) => (
                <BracketCard key={m.id} m={m} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BracketCard({ m }: { m: BracketMatch }) {
  const isFinal = m.round === "F";
  return (
    <li
      className={
        "rounded-2xl border p-3 text-sm " +
        (m.live
          ? "border-destructive/40 bg-destructive/5"
          : isFinal
            ? "border-primary/40 bg-primary/5"
            : "border-border bg-secondary/40")
      }
    >
      <BracketSide code={m.home} score={m.homeScore} winner={m.winner === m.home} />
      <div className="my-1 h-px bg-border/70" />
      <BracketSide code={m.away} score={m.awayScore} winner={m.winner === m.away} />
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{m.live ? "LIVE" : m.winner ? "FT" : (m.kickoff ?? "TBD")}</span>
        {isFinal && <span className="font-semibold text-primary">FINAL</span>}
      </div>
    </li>
  );
}

function BracketSide({ code, score, winner }: { code?: string; score?: number; winner?: boolean }) {
  return (
    <div
      className={
        "flex items-center justify-between " +
        (winner ? "font-semibold" : code ? "" : "text-muted-foreground")
      }
    >
      <span>{code ?? "TBD"}</span>
      <span className="tabular-nums text-xs">{score ?? "–"}</span>
    </div>
  );
}

function LeaderboardMini() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const board = useLeaderboard();
  const { me } = useMe();
  const top3 = board.slice(0, 3);
  const rank = board.findIndex((f) => f.uid === me.uid) + 1;
  return (
    <Card className="mt-6" as="section" data-testid="leaderboard-mini">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Predictions leaderboard</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Score points on poll & match predictions.
          </p>
        </div>
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all <Icon.Arrow className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ol className="mt-4 space-y-2">
        {top3.map((f, i) => (
          <li
            key={f.uid}
            className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-2.5 text-sm"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              <span className="font-medium">{f.name}</span>
              {mounted && f.uid === me.uid && (
                <span className="pill bg-primary/10 text-primary text-[10px]">You</span>
              )}
            </span>
            <span className="text-sm font-semibold tabular-nums">{f.points} pts</span>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Your rank</span>
        <span className="font-semibold">
          {mounted && rank ? `#${rank}` : "—"} · {mounted ? me.points : 0} pts · streak{" "}
          {mounted ? me.streak : 0}
        </span>
      </div>
    </Card>
  );
}
