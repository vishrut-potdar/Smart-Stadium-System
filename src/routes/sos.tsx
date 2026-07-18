/* eslint-disable react-hooks/exhaustive-deps */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, Icon, PanelHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const RESPONDER = {
  role: "Medical",
  name: "Dr. Priya Menon",
  channel: "Med-2",
  distance: 42, // meters
  gate: "Aisle 214 · Level 2",
};

const OTHER_STAFF = [
  { role: "Security", name: "Officer Rajan", distance: 68, channel: "Sec-1" },
  { role: "Volunteer", name: "Meera K.", distance: 55, channel: "Vol-4" },
];

const HOLD_MS = 1200;

type Stage = "idle" | "Dispatched" | "En route" | "Arrived";
const STAGE_ORDER: Stage[] = ["Dispatched", "En route", "Arrived"];

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "Emergency · Arena" },
      { name: "description", content: "Help is always seconds away." },
    ],
  }),
  component: SosPage,
});

function SosPage() {
  const { t } = useT();
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const start = useRef<number>(0);

  const triggered = stage !== "idle";

  const begin = () => {
    if (triggered) return;
    start.current = Date.now();
    timer.current = window.setInterval(() => {
      const pct = Math.min(1, (Date.now() - start.current) / HOLD_MS);
      setProgress(pct);
      if (pct >= 1) {
        setStage("Dispatched");
        end();
      }
    }, 30);
  };
  const end = () => {
    if (timer.current != null) {
      clearInterval(timer.current);
      timer.current = null;
    }
    if (!triggered) setProgress(0);
  };
  useEffect(() => () => end(), []);

  // Auto-advance stage
  useEffect(() => {
    if (stage === "Dispatched") {
      const t = setTimeout(() => setStage("En route"), 2500);
      return () => clearTimeout(t);
    }
    if (stage === "En route") {
      const t = setTimeout(() => setStage("Arrived"), 4500);
      return () => clearTimeout(t);
    }
  }, [stage]);

  return (
    <>
      <PanelHeader
        eyebrow="Adaptive Emergency"
        title="Help is always seconds away."
        desc="Hold to alert the closest medic, security officer, or volunteer. Watch their live status and route on the map."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="flex flex-col items-center justify-center py-10 text-center">
          <button
            data-testid="sos-button"
            onPointerDown={begin}
            onPointerUp={end}
            onPointerLeave={end}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                e.preventDefault();
                begin();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " ") end();
            }}
            aria-pressed={triggered}
            aria-label={triggered ? t("Alert sent") : t("Hold for help")}
            className={cn(
              "relative grid h-44 w-44 place-items-center overflow-hidden rounded-full transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
              triggered
                ? "bg-destructive text-destructive-foreground shadow-[0_0_60px_-10px_var(--color-destructive)]"
                : "bg-secondary text-foreground hover:bg-secondary/80",
            )}
          >
            {triggered && (
              <span
                className="absolute inset-0 animate-ping rounded-full bg-destructive/40"
                aria-hidden
              />
            )}
            {!triggered && progress > 0 && (
              <span
                className="absolute inset-0 rounded-full bg-destructive/30 transition-all"
                style={{ clipPath: `inset(${(1 - progress) * 100}% 0 0 0)` }}
                aria-hidden
              />
            )}
            <div className="relative">
              <Icon.Sos className="mx-auto h-12 w-12" />
              <div className="mt-1 text-sm font-semibold tracking-tight">
                {triggered ? t("Alert sent") : t("Hold for help")}
              </div>
            </div>
          </button>
          <p className="mt-4 max-w-[16rem] text-xs text-muted-foreground" aria-live="polite">
            {triggered
              ? "Responder notified. Stay where you are — help is on the way."
              : "Your location, seat, and health profile stay private until you send."}
          </p>
        </Card>

        <div className="grid gap-4">
          <ResponderStatus stage={stage} />
          <NearestStaff stage={stage} />
        </div>
      </div>
    </>
  );
}

function ResponderStatus({ stage }: { stage: Stage }) {
  const { t } = useT();
  return (
    <Card>
      <h2 className="text-sm font-semibold">Responder status</h2>
      <ol className="mt-4 space-y-3" data-testid="sos-timeline" aria-live="polite">
        {STAGE_ORDER.map((s, i) => {
          const active = stage === s;
          const done = STAGE_ORDER.indexOf(stage as Stage) > i;
          return (
            <li
              key={s}
              data-testid={`sos-stage-${s.toLowerCase().replace(" ", "-")}`}
              data-active={active || done}
              className="flex items-center gap-3"
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-success text-success-foreground",
                  active && "bg-accent text-accent-foreground",
                  !active && !done && "bg-secondary text-muted-foreground",
                )}
              >
                {done ? <Icon.Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className="flex-1">
                <div
                  className={cn("text-sm font-medium", !active && !done && "text-muted-foreground")}
                >
                  {t(s)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s === "Dispatched" && "Signal received · matched to closest medic"}
                  {s === "En route" && "Moving through Concourse 200"}
                  {s === "Arrived" && "At your seat"}
                </div>
              </div>
              {active && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function NearestStaff({ stage }: { stage: Stage }) {
  const { t } = useT();
  const progress =
    stage === "idle" ? 0 : stage === "Dispatched" ? 0.15 : stage === "En route" ? 0.6 : 1;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("Nearest responder")}</h2>
        <span className="pill bg-secondary text-muted-foreground">{RESPONDER.channel}</span>
      </div>

      {/* Map preview */}
      <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/40 to-secondary/10">
        <svg
          viewBox="0 0 400 200"
          className="h-44 w-full"
          role="img"
          aria-label="Route from responder to your seat"
        >
          <defs>
            <radialGradient id="sosPitch" cx="50%" cy="50%">
              <stop offset="0%" stopColor="oklch(0.82 0.18 145)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(0.6 0.16 145)" stopOpacity="0.7" />
            </radialGradient>
            <linearGradient id="sosRoute" x1="0" x2="1">
              <stop offset="0%" stopColor="oklch(0.62 0.22 25)" />
              <stop offset="100%" stopColor="oklch(0.72 0.18 250)" />
            </linearGradient>
            <filter id="sosGlow">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {/* Concourse rings */}
          <ellipse cx="200" cy="100" rx="186" ry="82" fill="currentColor" opacity="0.04" />
          <ellipse
            cx="200"
            cy="100"
            rx="186"
            ry="82"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
            opacity="0.18"
            strokeDasharray="2 3"
          />
          <ellipse
            cx="200"
            cy="100"
            rx="150"
            ry="62"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.22"
          />
          {/* Pitch */}
          <rect x="158" y="73" width="84" height="54" rx="6" fill="url(#sosPitch)" />
          <rect
            x="158"
            y="73"
            width="84"
            height="54"
            rx="6"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <circle
            cx="200"
            cy="100"
            r="7"
            fill="none"
            stroke="white"
            strokeWidth="0.6"
            opacity="0.7"
          />
          <line x1="200" y1="73" x2="200" y2="127" stroke="white" strokeWidth="0.6" opacity="0.7" />

          {/* Compass hint */}
          <text x="20" y="16" fontSize="8" fontWeight="600" fill="currentColor" opacity="0.5">
            LIVE ROUTE
          </text>

          {/* Path (curved) */}
          {stage !== "idle" && (
            <>
              <path
                d="M60,150 Q160,170 220,130 T310,60"
                fill="none"
                stroke="url(#sosRoute)"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.15"
              />
              <path
                d="M60,150 Q160,170 220,130 T310,60"
                fill="none"
                stroke="url(#sosRoute)"
                strokeWidth="2.6"
                strokeDasharray="6 6"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-24"
                  dur="1.1s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}

          {/* User seat */}
          <g>
            <circle
              cx="310"
              cy="60"
              r="12"
              fill="oklch(0.65 0.19 250)"
              opacity="0.25"
              filter="url(#sosGlow)"
            />
            <circle
              cx="310"
              cy="60"
              r="6.5"
              fill="oklch(0.65 0.19 250)"
              stroke="white"
              strokeWidth="1.5"
              data-testid="user-marker"
            />
            <text
              x="310"
              y="42"
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="currentColor"
              opacity="0.75"
            >
              You · 214-F
            </text>
          </g>

          {/* Responder marker */}
          {stage !== "idle" &&
            (() => {
              // interpolate along the curve approximately
              const p = progress;
              const x = 60 + (310 - 60) * p;
              const y = 150 - 90 * p;
              return (
                <g data-testid="responder-marker">
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="oklch(0.62 0.22 25)"
                    opacity="0.25"
                    filter="url(#sosGlow)"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="7"
                    fill="oklch(0.62 0.22 25)"
                    stroke="white"
                    strokeWidth="1.5"
                  >
                    <animate attributeName="r" values="6;9;6" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                  <text
                    x={x}
                    y={y + 18}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill="currentColor"
                    opacity="0.75"
                  >
                    Medic · {Math.max(0, Math.round(RESPONDER.distance * (1 - p)))}m
                  </text>
                </g>
              );
            })()}
        </svg>
      </div>

      <ul className="mt-4 space-y-2" role="list" data-testid="staff-list">
        <li className="flex items-center justify-between rounded-2xl bg-accent/10 p-3">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
              aria-hidden
            >
              {RESPONDER.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-medium">
                {t(RESPONDER.role)} · {RESPONDER.name}
              </div>
              <div className="text-xs text-muted-foreground">{RESPONDER.gate}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{RESPONDER.distance} m</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {stage === "idle" ? "Standby" : stage === "Arrived" ? "Here" : "En route"}
            </div>
          </div>
        </li>
        {OTHER_STAFF.map((s) => (
          <li
            key={s.role}
            className="flex items-center justify-between rounded-2xl bg-secondary/60 p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-elevated text-xs font-semibold"
                aria-hidden
              >
                {s.role[0]}
              </div>
              <div>
                <div className="text-sm font-medium">{t(s.role)}</div>
                <div className="text-xs text-muted-foreground">
                  {s.name} · {s.channel}
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold">{s.distance} m</div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
