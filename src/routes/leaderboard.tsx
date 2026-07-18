import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, PanelHeader } from "@/components/AppShell";
import { useLeaderboard, useMe } from "@/lib/leaderboard";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Predictions leaderboard · Arena" },
      {
        name: "description",
        content: "Score points on poll and match predictions across the tournament.",
      },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const board = useLeaderboard();
  const { me, setName } = useMe();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (me.name) {
      setDraft(me.name);
    }
  }, [me.name]);

  const rank = useMemo(() => board.findIndex((f) => f.uid === me.uid) + 1, [board, me.uid]);

  return (
    <>
      <PanelHeader
        eyebrow="Predictions leaderboard"
        title="Every prediction counts."
        desc="Score points on fan polls and match predictions. Streaks earn bonuses. Perfect rounds unlock a badge."
      />

      <Card className="mb-6" as="section" aria-labelledby="me-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              id="me-heading"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              You
            </h2>
            {editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setName(draft);
                  setEditing(false);
                }}
                className="mt-1 flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm"
                  aria-label="Display name"
                  maxLength={24}
                />
                <button
                  type="submit"
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setDraft(me.name);
                  setEditing(true);
                }}
                data-testid="edit-name"
                className="mt-1 rounded-full text-lg font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {mounted ? me.name : "You"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <MeStat k="Rank" v={mounted && rank ? `#${rank}` : "—"} />
            <MeStat k="Points" v={mounted ? me.points.toString() : "0"} />
            <MeStat k="Streak" v={mounted ? me.streak.toString() : "0"} />
            <MeStat k="Best" v={mounted ? me.best.toString() : "0"} />
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          Scoring: match winner <b>+10</b>, exact score bonus <b>+5</b>, poll majority pick{" "}
          <b>+3</b>, streak bonus <b>+2</b> per consecutive correct.
        </p>
      </Card>

      <Card as="section" aria-labelledby="board-heading" data-testid="leaderboard">
        <h2 id="board-heading" className="text-sm font-semibold">
          Top fans
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Predictions leaderboard, sorted by points then correct predictions
            </caption>
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 text-left">#</th>
                <th className="py-2 text-left">Fan</th>
                <th className="px-2 text-right">Points</th>
                <th className="px-2 text-right">Correct</th>
                <th className="px-2 text-right">Streak</th>
                <th className="px-2 text-right">Badges</th>
              </tr>
            </thead>
            <tbody>
              {board.slice(0, 20).map((f, i) => {
                const isMe = mounted && f.uid === me.uid;
                return (
                  <tr
                    key={f.uid}
                    className={"border-t border-border/60 " + (isMe ? "bg-accent/[0.06]" : "")}
                  >
                    <td className="py-2.5 tabular-nums">{i + 1}</td>
                    <td className="py-2.5">
                      <span className="font-medium">{f.name}</span>
                      {isMe && (
                        <span className="ml-2 pill bg-primary/10 text-primary text-[10px]">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-2 text-right tabular-nums font-semibold">{f.points}</td>
                    <td className="px-2 text-right tabular-nums">{f.correct}</td>
                    <td className="px-2 text-right tabular-nums">{f.streak}</td>
                    <td className="px-2 text-right">
                      {f.best >= 5 && (
                        <span title="Perfect round" aria-label="Perfect round">
                          🏆
                        </span>
                      )}
                      {f.best >= 3 && f.best < 5 && (
                        <span title="Hot streak" aria-label="Hot streak">
                          🔥
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function MeStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="text-lg font-semibold tabular-nums">{v}</div>
    </div>
  );
}
