// Client-side prediction form with Zod validation. Uses local leaderboard
// store (localStorage). Signed-in cross-device sync is queued for the next
// iteration — see .lovable/plan.md.
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Card, Icon } from "@/components/AppShell";
import { useMe } from "@/lib/leaderboard";
import { ScoringRulesDialog } from "@/components/ScoringRulesDialog";

const Schema = z.object({
  home: z.coerce.number().int().min(0, "Min 0").max(15, "Max 15"),
  away: z.coerce.number().int().min(0, "Min 0").max(15, "Max 15"),
});

type Props = {
  matchId: string;
  home: string;
  away: string;
  kickoffAt?: number; // ms
};

export function PredictionForm({ matchId, home, away, kickoffAt }: Props) {
  const { me, submitPrediction } = useMe();
  const existing = useMemo(
    () => me.predictions.find((p) => p.id === matchId && p.kind === "match"),
    [me, matchId],
  );
  const [h, setH] = useState(existing?.choice.split("-")[0] ?? "");
  const [a, setA] = useState(existing?.choice.split("-")[1] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setH(existing.choice.split("-")[0] ?? "");
      setA(existing.choice.split("-")[1] ?? "");
    }
  }, [existing]);

  const past = kickoffAt ? Date.now() > kickoffAt : false;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(null);
    if (past) {
      setError("Predictions locked — kickoff has passed.");
      return;
    }
    const parsed = Schema.safeParse({ home: h, away: a });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    const choice = `${parsed.data.home}-${parsed.data.away}`;
    submitPrediction({ id: matchId, kind: "match", choice });
    setSaved(`Locked in: ${home} ${choice} ${away}`);
  };

  return (
    <Card data-testid="prediction-form" className="mt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="pill inline-flex bg-accent/10 text-accent text-[10px]">
            <Icon.Spark className="mr-1 h-3 w-3" /> Fan predictions
          </div>
          <h2 className="mt-2 text-lg font-semibold">
            Predict {home} vs {away}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick the final score. Points awarded when the match resolves.
          </p>
        </div>
        <ScoringRulesDialog />
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted-foreground">
          {home}
          <input
            data-testid="pred-home"
            type="number"
            min={0}
            max={15}
            value={h}
            onChange={(e) => setH(e.target.value)}
            className="mt-1 block w-20 rounded-xl border border-border bg-background px-3 py-2 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </label>
        <span className="pb-3 text-lg font-semibold text-muted-foreground">–</span>
        <label className="text-xs text-muted-foreground">
          {away}
          <input
            data-testid="pred-away"
            type="number"
            min={0}
            max={15}
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="mt-1 block w-20 rounded-xl border border-border bg-background px-3 py-2 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </label>
        <button
          data-testid="pred-submit"
          type="submit"
          disabled={past}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {existing ? "Update pick" : "Lock in"}
        </button>
      </form>
      {error && (
        <p
          role="alert"
          data-testid="pred-error"
          className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          data-testid="pred-saved"
          className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary"
        >
          {saved}
        </p>
      )}
    </Card>
  );
}
