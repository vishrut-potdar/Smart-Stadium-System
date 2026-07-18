import { useState } from "react";
import { Icon } from "@/components/AppShell";

const RULES = [
  {
    pts: "+10",
    label: "Correct match winner",
    detail: "Awarded when your predicted winner matches the final result.",
  },
  {
    pts: "+5",
    label: "Exact score bonus",
    detail: "On top of the winner points when your predicted score is exact.",
  },
  {
    pts: "+3",
    label: "Majority poll pick",
    detail: "You picked the side the majority of fans predicted correctly.",
  },
  {
    pts: "+2",
    label: "Streak bonus",
    detail: "Extra per consecutive correct pick — resets on a miss.",
  },
];

export function ScoringRulesDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        data-testid="scoring-rules-trigger"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] font-medium hover:bg-secondary/60"
        }
        aria-haspopup="dialog"
      >
        <Icon.Spark className="h-3 w-3" /> How scoring works
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="scoring-rules-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Scoring rules</h3>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-secondary/60"
              >
                <span aria-hidden className="text-sm">
                  ✕
                </span>
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Every prediction is worth points. Higher confidence and streaks pay more.
            </p>
            <ul className="mt-4 space-y-3">
              {RULES.map((r) => (
                <li key={r.label} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-3">
                  <span className="pill bg-primary text-primary-foreground text-[10px]">
                    {r.pts}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{r.label}</div>
                    <div className="text-[11px] text-muted-foreground">{r.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-primary/5 p-3 text-[11px] text-muted-foreground">
              Example: predict Argentina 2–1 France, they win 2–1, and it's your 3rd correct in a
              row → <span className="font-semibold text-primary">10 + 5 + 2 = 17 pts</span>.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
