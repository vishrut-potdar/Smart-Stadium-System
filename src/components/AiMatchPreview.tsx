import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, Icon } from "@/components/AppShell";
import { generateMatchPreview } from "@/lib/match-preview.functions";
import { useT } from "@/lib/i18n";

type Props = { home: string; away: string; venue?: string };

interface KeyPlayer {
  team: string;
  player: string;
  why: string;
}

interface Prediction {
  winner: string;
  score: string;
  confidence: string;
}

interface MatchPreviewData {
  headline: string;
  tactical_brief: string;
  key_players: KeyPlayer[];
  prediction: Prediction;
}

export function AiMatchPreview({ home, away, venue }: Props) {
  const gen = useServerFn(generateMatchPreview);
  const { t } = useT();
  const { lang } = useT();
  const [preview, setPreview] = useState<MatchPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await gen({ data: { home, away, venue, lang } });
      setPreview(r.preview);
      if (r.error) setError(r.error);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load preview";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Re-run when language changes so the preview stays localized
  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [lang, home, away]);

  return (
    <Card data-testid="ai-match-preview" className="mt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="pill inline-flex bg-primary/10 text-primary text-[10px]">
            <Icon.Spark className="mr-1 h-3 w-3" /> AI · {t("Match preview")}
          </div>
          <h2 className="mt-2 text-lg font-semibold">
            {preview?.headline ?? `${home} vs ${away}`}
          </h2>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full border border-border px-3 py-1 text-[11px] hover:bg-secondary/60 disabled:opacity-50"
        >
          {loading ? "…" : t("Refresh")}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          data-testid="ai-preview-error"
          className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning-foreground"
        >
          {error}
        </p>
      )}

      {preview && (
        <>
          <p className="mt-3 text-sm text-muted-foreground">{preview.tactical_brief}</p>
          {preview.key_players?.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {preview.key_players.map((p: KeyPlayer, i: number) => (
                <li key={i} className="rounded-xl bg-secondary/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{p.player}</span>
                    <span className="pill bg-background text-[10px]">{p.team}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{p.why}</p>
                </li>
              ))}
            </ul>
          )}
          {preview.prediction && (
            <div className="mt-4 rounded-xl bg-primary/5 p-3 text-xs">
              <span className="font-semibold text-primary">{t("AI prediction")}:</span>{" "}
              {preview.prediction.winner} · {preview.prediction.score}{" "}
              <span className="text-muted-foreground">({preview.prediction.confidence})</span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
