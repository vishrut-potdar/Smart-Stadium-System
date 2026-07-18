import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, Icon, PanelHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { readCache, writeCache, formatAge } from "@/lib/offline-cache";

type DestId = "seat" | "exit" | "park" | "rest" | "food";

type Dest = {
  id: DestId;
  labelKey: string;
  detail: string;
  eta: string;
  steps: string[];
  path: string; // svg path in map viewBox 0 0 400 260
};

// User's current position (Concourse 200 rail) in the map viewBox 0 0 400 260.
// Kept OUTSIDE the pitch rect (160-240, 105-155) so the marker never
// appears on the field of play.
const USER_POS = { x: 330, y: 190 };

const DESTINATIONS: Dest[] = [
  {
    id: "seat",
    labelKey: "My seat",
    detail: "Sec 214 · Row F · Seat 12",
    eta: "3 min",
    steps: [
      "Head right along Concourse 200",
      "Take the escalator up to Level 2",
      "Turn left into Vomitory 214B",
      "Row F · Seat 12 is on your right",
    ],
    // ends inside the seat bowl, safely outside the pitch
    path: "M330,190 L320,150 L305,120 L290,95",
  },
  {
    id: "exit",
    labelKey: "Nearest exit",
    detail: "Gate B · West wing",
    eta: "2 min",
    steps: [
      "Leave your row via Vomitory 214A",
      "Follow the West signage",
      "Descend Escalator 3 to Level 1",
      "Gate B is 40 m to your left",
    ],
    path: "M330,190 L240,205 L140,200 L80,170 L40,120",
  },
  {
    id: "park",
    labelKey: "My parking",
    detail: "Level P2 · Zone 14 · Slot 87",
    eta: "6 min",
    steps: [
      "Exit via Gate B",
      "Walk across the North Plaza",
      "Enter Parking Ramp P2",
      "Zone 14, Slot 87 — remembered from your NFC tap",
    ],
    path: "M330,190 L220,225 L120,235 L40,230",
  },
  {
    id: "rest",
    labelKey: "Restroom",
    detail: "Concourse 200 · Low queue (1 min)",
    eta: "1 min",
    steps: [
      "Exit row F via aisle right",
      "Restroom is 12 m ahead on Concourse 200",
      "Queue is under 2 people right now",
    ],
    path: "M330,190 L305,200 L280,208",
  },
  {
    id: "food",
    labelKey: "Concession",
    detail: "Burger Grill · 84% capacity",
    eta: "4 min",
    steps: [
      "Head right along Concourse 200",
      "Escalator down to Level 1",
      "Follow signage to Burger Grill",
      "Consider pre-ordering to skip queue",
    ],
    path: "M330,190 L260,220 L180,230 L110,230",
  },
];

export const Route = createFileRoute("/nfc")({
  head: () => ({
    meta: [
      { title: "NFC wayfinding · Arena" },
      { name: "description", content: "Tap once. Arrive anywhere in the venue." },
    ],
  }),
  component: NfcPage,
});

function NfcPage() {
  const [tapped, setTapped] = useState(false);
  const [dest, setDest] = useState<Dest | null>(null);
  const { t } = useT();

  // Offline cache: prime destinations & user position, refresh on mount.
  const [cache, setCache] = useState<{ at: number } | null>(null);
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const existing = readCache<typeof DESTINATIONS>("wayfinding");
    writeCache("wayfinding", DESTINATIONS);
    setCache({ at: Date.now() });
    if (existing && !cache) setCache({ at: existing.at });
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PanelHeader
        eyebrow="NFC Wayfinding"
        title="Tap once. Arrive anywhere."
        desc="Touch an Arena tag on rails, doorways, and seat backs. A step-by-step route to your seat, the nearest exit, or your parking spot appears instantly."
      />
      <div className="mb-4 flex items-center gap-2" data-testid="offline-badge">
        <span
          className={cn(
            "pill inline-flex items-center gap-1.5",
            online ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-success" : "bg-warning")} />
          {online ? "Online" : "Offline mode"}
        </span>
        {cache && (
          <span className="text-[11px] text-muted-foreground">
            Wayfinding cached · updated {formatAge(cache.at)}
          </span>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <button
            aria-label="Simulate NFC tap"
            data-testid="nfc-tap"
            onClick={() => {
              setTapped(true);
              setDest(null);
            }}
            className="relative grid h-40 w-40 place-items-center rounded-full bg-secondary transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {tapped && (
              <>
                <span
                  className="absolute inset-0 animate-ping rounded-full bg-accent/20"
                  aria-hidden
                />
                <span
                  className="absolute inset-4 animate-ping rounded-full bg-accent/30 [animation-delay:150ms]"
                  aria-hidden
                />
              </>
            )}
            <Icon.Nfc className="relative h-16 w-16 text-primary" />
          </button>
          <p className="mt-6 text-sm font-medium" aria-live="polite">
            {tapped ? "Tag detected · Seat back 214-F-12" : "Tap the tag to begin"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tapped ? "Choose where you'd like to go" : "Simulates a physical NFC touch"}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Stadium map</h2>
            <span className="text-[11px] text-muted-foreground">You are at Sec 214 · Row F</span>
          </div>
          <StadiumMap dest={dest} />
          <h3 className="mt-4 text-sm font-semibold">Destinations</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2" role="list">
            {DESTINATIONS.map((d) => (
              <li key={d.id}>
                <button
                  disabled={!tapped}
                  data-testid={`dest-${d.id}`}
                  onClick={() => setDest(d)}
                  aria-label={`Go to ${t(d.labelKey)}, ${d.detail}, estimated ${d.eta}`}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border border-transparent bg-secondary/60 px-4 py-3 text-left transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    dest?.id === d.id && "border-accent bg-accent/5",
                  )}
                >
                  <span>
                    <span className="block text-sm font-medium">{t(d.labelKey)}</span>
                    <span className="block text-xs text-muted-foreground">{d.detail}</span>
                  </span>
                  <span className="text-xs font-medium text-accent">{d.eta}</span>
                </button>
              </li>
            ))}
          </ul>

          {dest && (
            <div
              className="mt-5 rounded-2xl bg-primary p-4 text-primary-foreground"
              role="status"
              data-testid="nfc-directions"
            >
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Icon.Arrow className="h-3.5 w-3.5" /> Turn-by-turn active
              </div>
              <div className="mt-1 text-base font-medium">
                {t("Head to")} {t(dest.labelKey).toLowerCase()} — {dest.eta}
              </div>
              <ol className="mt-3 space-y-2 text-sm" data-testid="nfc-steps">
                {dest.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-white/20 text-[10px] font-semibold">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function StadiumMap({ dest }: { dest: Dest | null }) {
  // Aesthetic stylized top-down (viewBox 400x260) with layered concourses,
  // pitch markings, sector wedges, gates and animated route.
  const endMatch = dest ? /L([\d.]+),([\d.]+)$/.exec(dest.path) : null;
  return (
    <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/40 to-secondary/10">
      <svg viewBox="0 0 400 260" className="h-64 w-full" role="img" aria-label="Stadium map">
        <defs>
          <radialGradient id="pitchGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="oklch(0.82 0.18 145)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.62 0.16 145)" stopOpacity="0.75" />
          </radialGradient>
          <radialGradient id="bowlGrad" cx="50%" cy="50%">
            <stop offset="60%" stopColor="currentColor" stopOpacity="0.03" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.14" />
          </radialGradient>
          <linearGradient id="routeGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.18 250)" />
            <stop offset="100%" stopColor="oklch(0.68 0.16 155)" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Outer concourse ring */}
        <ellipse cx="200" cy="130" rx="188" ry="112" fill="url(#bowlGrad)" />
        <ellipse
          cx="200"
          cy="130"
          rx="188"
          ry="112"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.18"
          strokeDasharray="2 3"
        />
        {/* Seat bowl */}
        <ellipse cx="200" cy="130" rx="150" ry="85" fill="currentColor" opacity="0.05" />
        <ellipse
          cx="200"
          cy="130"
          rx="150"
          ry="85"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.25"
        />
        {/* Sector wedges */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x1 = 200 + Math.cos(a) * 118;
          const y1 = 130 + Math.sin(a) * 68;
          const x2 = 200 + Math.cos(a) * 148;
          const y2 = 130 + Math.sin(a) * 84;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              opacity="0.15"
              strokeWidth="0.6"
            />
          );
        })}
        {/* Pitch */}
        <rect x="158" y="103" width="84" height="54" rx="6" fill="url(#pitchGrad)" />
        <rect
          x="158"
          y="103"
          width="84"
          height="54"
          rx="6"
          fill="none"
          stroke="white"
          strokeWidth="0.8"
          opacity="0.7"
        />
        <line x1="200" y1="103" x2="200" y2="157" stroke="white" strokeWidth="0.6" opacity="0.7" />
        <circle
          cx="200"
          cy="130"
          r="7"
          fill="none"
          stroke="white"
          strokeWidth="0.6"
          opacity="0.7"
        />
        <rect
          x="158"
          y="118"
          width="10"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="0.6"
          opacity="0.7"
        />
        <rect
          x="232"
          y="118"
          width="10"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="0.6"
          opacity="0.7"
        />

        {/* Compass */}
        {["N", "E", "S", "W"].map((s, i) => {
          const positions = [
            [200, 24],
            [378, 132],
            [200, 246],
            [22, 132],
          ];
          const [x, y] = positions[i];
          return (
            <text
              key={s}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="currentColor"
              opacity="0.45"
            >
              {s}
            </text>
          );
        })}

        {/* Gates */}
        {[
          { x: 30, y: 120, code: "B" },
          { x: 370, y: 140, code: "C" },
          { x: 200, y: 34, code: "A" },
          { x: 200, y: 226, code: "D" },
        ].map((g) => (
          <g key={g.code}>
            <circle cx={g.x} cy={g.y} r="5" fill="oklch(0.62 0.22 25)" />
            <circle
              cx={g.x}
              cy={g.y}
              r="9"
              fill="none"
              stroke="oklch(0.62 0.22 25)"
              opacity="0.35"
            />
            <text
              x={g.x}
              y={g.y - 10}
              textAnchor="middle"
              fontSize="8"
              fontWeight="600"
              fill="currentColor"
              opacity="0.65"
            >
              Gate {g.code}
            </text>
          </g>
        ))}

        {/* User position — anchored to concourse rail */}
        <g>
          <circle
            cx={USER_POS.x}
            cy={USER_POS.y}
            r="14"
            fill="oklch(0.65 0.19 250)"
            opacity="0.25"
            filter="url(#softGlow)"
          />
          <circle
            cx={USER_POS.x}
            cy={USER_POS.y}
            r="6.5"
            fill="oklch(0.65 0.19 250)"
            stroke="white"
            strokeWidth="1.5"
          />
          <circle
            cx={USER_POS.x}
            cy={USER_POS.y}
            r="12"
            fill="none"
            stroke="oklch(0.65 0.19 250)"
            opacity="0.5"
          >
            <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <text
            x={USER_POS.x}
            y={USER_POS.y - 20}
            textAnchor="middle"
            fontSize="8"
            fontWeight="600"
            fill="currentColor"
            opacity="0.75"
          >
            You · Sec 214
          </text>
        </g>

        {/* Route */}
        {dest && (
          <>
            <path
              d={dest.path}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.15"
            />
            <path
              d={dest.path}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="2.6"
              strokeDasharray="6 6"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;-24"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </path>
            {endMatch && (
              <g>
                <circle
                  cx={endMatch[1]}
                  cy={endMatch[2]}
                  r="10"
                  fill="oklch(0.68 0.16 155)"
                  opacity="0.3"
                  filter="url(#softGlow)"
                />
                <circle
                  cx={endMatch[1]}
                  cy={endMatch[2]}
                  r="5.5"
                  fill="oklch(0.68 0.16 155)"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
