import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Compass, Utensils, Car, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./AppShell";

type MapSectionType = "gate" | "food" | "parking";

type MapSection = {
  id: string;
  name: string;
  type: MapSectionType;
  status: "Normal" | "Congested" | "Filling Fast" | "Open" | "Busy";
  metric: string; // e.g. "5 min wait", "90% full"
  metricLabel: string;
  desc: string;
  location: string;
  coordinates: string; // Used for tooltip positioning or custom label overlay
  actionLink?: string;
  actionText?: string;
};

const SECTIONS: MapSection[] = [
  {
    id: "gate-a",
    name: "Gate A (North Entrance)",
    type: "gate",
    status: "Normal",
    metric: "3 min wait",
    metricLabel: "Security Wait Time",
    desc: "Primary entrance for North stands. Features fast-track security lanes and express NFC ticketing scanners.",
    location: "Level 1 · North Side",
  },
  {
    id: "gate-b",
    name: "Gate B (West Entrance)",
    type: "gate",
    status: "Normal",
    metric: "4 min wait",
    metricLabel: "Security Wait Time",
    desc: "Main gate with direct connection to West Transit Hub and shuttle bus drop-off points.",
    location: "Level 1 · West Side",
  },
  {
    id: "gate-c",
    name: "Gate C (East Entrance)",
    type: "gate",
    status: "Congested",
    metric: "35 min wait",
    metricLabel: "Security Wait Time",
    desc: "Currently experiencing extremely high incoming traffic. Fans are strongly encouraged to detour to Gates A or B.",
    location: "Level 1 · East Side",
  },
  {
    id: "gate-d",
    name: "Gate D (South Entrance)",
    type: "gate",
    status: "Busy",
    metric: "15 min wait",
    metricLabel: "Security Wait Time",
    desc: "Direct link to South Parking Lot. Security flow is steady but slower due to scanner lane reduction.",
    location: "Level 1 · South Side",
  },
  {
    id: "food-burger",
    name: "Burger Grill",
    type: "food",
    status: "Busy",
    metric: "12 min wait",
    metricLabel: "Queue Wait Time",
    desc: "Premium flame-grilled beef burgers, hot dogs, and fresh fries. Supports mobile pre-ordering to skip the physical line.",
    location: "Concourse 100 · Section 104",
    actionLink: "/food",
    actionText: "Pre-order Burger",
  },
  {
    id: "food-coffee",
    name: "Coffee Bar",
    type: "food",
    status: "Open",
    metric: "2 min wait",
    metricLabel: "Queue Wait Time",
    desc: "Freshly brewed espresso drinks, cold brews, and premium sweet pastries. Fast turnaround.",
    location: "Concourse 200 · Section 212",
    actionLink: "/food",
    actionText: "Order Coffee",
  },
  {
    id: "food-beer",
    name: "Craft Beer Station",
    type: "food",
    status: "Busy",
    metric: "15 min wait",
    metricLabel: "Queue Wait Time",
    desc: "Local draft IPA, lagers, and traditional German pretzels. Must be 21+ with verified ID.",
    location: "Concourse 200 · Section 224",
    actionLink: "/food",
    actionText: "Pre-order Drinks",
  },
  {
    id: "park-south",
    name: "South Parking Lot",
    type: "parking",
    status: "Congested",
    metric: "98% capacity",
    metricLabel: "Current Occupancy",
    desc: "Almost completely full. Tailgating is active. Direct pedestrian walkway leading to Gate D.",
    location: "Outside Stadium · South Gate Sector",
  },
  {
    id: "park-north",
    name: "North Deck Parking",
    type: "parking",
    status: "Normal",
    metric: "45% capacity",
    metricLabel: "Current Occupancy",
    desc: "Multi-level parking garage. Safe, covered parking with quick access to the North Plaza and Gate A.",
    location: "Outside Stadium · North Gate Sector",
  },
  {
    id: "park-east",
    name: "East Grass Lot",
    type: "parking",
    status: "Normal",
    metric: "22% capacity",
    metricLabel: "Current Occupancy",
    desc: "Open-air overflow grass field parking. Highly affordable pricing with complimentary golf-cart shuttles to Gate C.",
    location: "Outside Stadium · East Gate Sector",
  },
];

export function InteractiveStadiumMap() {
  const [selectedId, setSelectedId] = useState<string>("gate-a");
  const selected = SECTIONS.find((s) => s.id === selectedId) || SECTIONS[0];

  return (
    <Card className="mt-6" as="section" aria-label="Interactive Stadium Map">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold">Interactive Stadium Map</h3>
          <p className="text-xs text-muted-foreground">
            Click sections on the map or list to inspect gate wait times, food stalls, and parking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill bg-primary/10 text-primary flex items-center gap-1 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live feeds active
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Interactive SVG Map Column */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-secondary/40 to-secondary/10 p-4">
          <svg
            viewBox="0 0 500 380"
            className="w-full max-h-[340px]"
            role="img"
            aria-label="Interactive stadium diagram"
          >
            <defs>
              <radialGradient id="pitchGradIndex" cx="50%" cy="50%">
                <stop offset="0%" stopColor="oklch(0.82 0.18 145)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="oklch(0.62 0.16 145)" stopOpacity="0.75" />
              </radialGradient>
              <radialGradient id="bowlGradIndex" cx="50%" cy="50%">
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.02" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
              </radialGradient>
              <filter id="glowIndex" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Parking Lot Hotspots */}
            <g
              role="button"
              tabIndex={0}
              aria-label="North Parking Lot, 45% occupancy"
              aria-pressed={selectedId === "park-north"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("park-north");
                }
              }}
              className="cursor-pointer group focus-visible:outline-none"
              onClick={() => setSelectedId("park-north")}
            >
              <rect
                x="30"
                y="20"
                width="140"
                height="50"
                rx="8"
                className={cn(
                  "transition-all duration-300",
                  selectedId === "park-north"
                    ? "fill-primary/20 stroke-primary stroke-2"
                    : "fill-secondary/60 stroke-border group-hover:fill-secondary/80 group-focus-visible:stroke-primary group-focus-visible:stroke-2 group-focus-visible:fill-secondary/80",
                )}
              />
              <text
                x="100"
                y="45"
                textAnchor="middle"
                className="text-[10px] font-bold fill-muted-foreground select-none"
              >
                North Parking Lot (45%)
              </text>
            </g>

            <g
              role="button"
              tabIndex={0}
              aria-label="South Parking Lot, 98% occupancy, heavy congestion"
              aria-pressed={selectedId === "park-south"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("park-south");
                }
              }}
              className="cursor-pointer group focus-visible:outline-none"
              onClick={() => setSelectedId("park-south")}
            >
              <rect
                x="30"
                y="310"
                width="140"
                height="50"
                rx="8"
                className={cn(
                  "transition-all duration-300",
                  selectedId === "park-south"
                    ? "fill-destructive/15 stroke-destructive stroke-2"
                    : "fill-secondary/60 stroke-border group-hover:fill-secondary/80 group-focus-visible:stroke-destructive group-focus-visible:stroke-2 group-focus-visible:fill-secondary/80",
                )}
              />
              <text
                x="100"
                y="335"
                textAnchor="middle"
                className="text-[10px] font-bold fill-muted-foreground select-none"
              >
                South Parking Lot (98%)
              </text>
            </g>

            <g
              role="button"
              tabIndex={0}
              aria-label="East Parking Lot, 22% occupancy"
              aria-pressed={selectedId === "park-east"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("park-east");
                }
              }}
              className="cursor-pointer group focus-visible:outline-none"
              onClick={() => setSelectedId("park-east")}
            >
              <rect
                x="370"
                y="140"
                width="100"
                height="100"
                rx="8"
                className={cn(
                  "transition-all duration-300",
                  selectedId === "park-east"
                    ? "fill-primary/20 stroke-primary stroke-2"
                    : "fill-secondary/60 stroke-border group-hover:fill-secondary/80 group-focus-visible:stroke-primary group-focus-visible:stroke-2 group-focus-visible:fill-secondary/80",
                )}
              />
              <text
                x="420"
                y="185"
                textAnchor="middle"
                className="text-[10px] font-bold fill-muted-foreground select-none"
              >
                East Lot
              </text>
              <text
                x="420"
                y="200"
                textAnchor="middle"
                className="text-[9px] fill-muted-foreground select-none"
              >
                (22%)
              </text>
            </g>

            {/* Stadium Bowl outer boundary */}
            <ellipse
              cx="250"
              cy="190"
              rx="150"
              ry="105"
              fill="url(#bowlGradIndex)"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.15"
            />
            <ellipse
              cx="250"
              cy="190"
              rx="125"
              ry="85"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              opacity="0.12"
              strokeDasharray="3 3"
            />

            {/* Sector wedges (Clickable regions of the stadium seating/concourse) */}
            {/* Top wedge (Burger) */}
            <path
              d="M 250 190 L 175 105 A 125 85 0 0 1 325 105 Z"
              role="button"
              tabIndex={0}
              aria-label="North Seating Stand - Burger Grill Vendor Sector"
              aria-pressed={selectedId === "food-burger"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("food-burger");
                }
              }}
              className={cn(
                "cursor-pointer transition-all duration-300 fill-transparent stroke-border/40 hover:fill-accent/10 focus-visible:outline-none focus-visible:fill-accent/10 focus-visible:stroke-accent focus-visible:stroke-2",
                selectedId === "food-burger" && "fill-accent/15 stroke-accent stroke-2",
              )}
              onClick={() => setSelectedId("food-burger")}
            />

            {/* Left wedge (Coffee) */}
            <path
              d="M 250 190 L 125 190 A 125 85 0 0 1 175 105 Z"
              role="button"
              tabIndex={0}
              aria-label="West Seating Stand - Espresso & Brews Sector"
              aria-pressed={selectedId === "food-coffee"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("food-coffee");
                }
              }}
              className={cn(
                "cursor-pointer transition-all duration-300 fill-transparent stroke-border/40 hover:fill-accent/10 focus-visible:outline-none focus-visible:fill-accent/10 focus-visible:stroke-accent focus-visible:stroke-2",
                selectedId === "food-coffee" && "fill-accent/15 stroke-accent stroke-2",
              )}
              onClick={() => setSelectedId("food-coffee")}
            />

            {/* Bottom-right wedge (Craft Beer) */}
            <path
              d="M 250 190 L 325 275 A 125 85 0 0 1 125 190 Z"
              role="button"
              tabIndex={0}
              aria-label="South-East Seating Stand - Craft Beer Garden Sector"
              aria-pressed={selectedId === "food-beer"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("food-beer");
                }
              }}
              className={cn(
                "cursor-pointer transition-all duration-300 fill-transparent stroke-border/40 hover:fill-accent/10 focus-visible:outline-none focus-visible:fill-accent/10 focus-visible:stroke-accent focus-visible:stroke-2",
                selectedId === "food-beer" && "fill-accent/15 stroke-accent stroke-2",
              )}
              onClick={() => setSelectedId("food-beer")}
            />

            {/* Center Turf Pitch */}
            <rect
              x="210"
              y="160"
              width="80"
              height="60"
              rx="4"
              fill="url(#pitchGradIndex)"
              stroke="white"
              strokeWidth="0.8"
              opacity="0.8"
            />
            <line
              x1="250"
              y1="160"
              x2="250"
              y2="220"
              stroke="white"
              strokeWidth="0.6"
              opacity="0.8"
            />
            <circle
              cx="250"
              cy="190"
              r="10"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
              opacity="0.8"
            />

            {/* Gate circle nodes */}
            {/* Gate A (Top) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="Gate A Entrance, Top Section"
              aria-pressed={selectedId === "gate-a"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("gate-a");
                }
              }}
              className="cursor-pointer group focus-visible:outline-none"
              onClick={() => setSelectedId("gate-a")}
            >
              <circle
                cx="250"
                cy="85"
                r="10"
                className={cn(
                  "transition-all duration-300",
                  selectedId === "gate-a"
                    ? "fill-primary stroke-white stroke-2"
                    : "fill-secondary stroke-border group-hover:fill-secondary-foreground/20 group-focus-visible:fill-primary group-focus-visible:stroke-white group-focus-visible:stroke-2",
                )}
              />
              <text
                x="250"
                y="88"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                className={
                  selectedId === "gate-a"
                    ? "fill-primary-foreground"
                    : "fill-foreground group-focus-visible:fill-primary-foreground"
                }
              >
                A
              </text>
              <text
                x="250"
                y="70"
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="currentColor"
                opacity="0.65"
              >
                Gate A
              </text>
            </g>

            {/* Gate B (Left) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="Gate B Entrance, Left Section"
              aria-pressed={selectedId === "gate-b"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("gate-b");
                }
              }}
              className="cursor-pointer group focus-visible:outline-none"
              onClick={() => setSelectedId("gate-b")}
            >
              <circle
                cx="100"
                cy="190"
                r="10"
                className={cn(
                  "transition-all duration-300",
                  selectedId === "gate-b"
                    ? "fill-primary stroke-white stroke-2"
                    : "fill-secondary stroke-border group-hover:fill-secondary-foreground/20 group-focus-visible:fill-primary group-focus-visible:stroke-white group-focus-visible:stroke-2",
                )}
              />
              <text
                x="100"
                y="193"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                className={
                  selectedId === "gate-b"
                    ? "fill-primary-foreground"
                    : "fill-foreground group-focus-visible:fill-primary-foreground"
                }
              >
                B
              </text>
              <text
                x="75"
                y="193"
                textAnchor="end"
                fontSize="9"
                fontWeight="600"
                fill="currentColor"
                opacity="0.65"
              >
                Gate B
              </text>
            </g>

            {/* Gate C (Right) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="Gate C Entrance, Right Section, High congestion"
              aria-pressed={selectedId === "gate-c"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("gate-c");
                }
              }}
              className="cursor-pointer group focus-visible:outline-none"
              onClick={() => setSelectedId("gate-c")}
            >
              <circle
                cx="400"
                cy="190"
                r="10"
                className={cn(
                  "transition-all duration-300",
                  selectedId === "gate-c"
                    ? "fill-destructive stroke-white stroke-2"
                    : "fill-secondary stroke-border group-hover:fill-secondary-foreground/20 group-focus-visible:fill-destructive group-focus-visible:stroke-white group-focus-visible:stroke-2",
                )}
              />
              <text
                x="400"
                y="193"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                className={
                  selectedId === "gate-c"
                    ? "fill-destructive-foreground"
                    : "fill-foreground group-focus-visible:fill-destructive-foreground"
                }
              >
                C
              </text>
              <text
                x="425"
                y="193"
                textAnchor="start"
                fontSize="9"
                fontWeight="600"
                fill="currentColor"
                opacity="0.65"
              >
                Gate C
              </text>
            </g>

            {/* Gate D (Bottom) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="Gate D Entrance, Bottom Section, Medium congestion"
              aria-pressed={selectedId === "gate-d"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId("gate-d");
                }
              }}
              className="cursor-pointer group focus-visible:outline-none"
              onClick={() => setSelectedId("gate-d")}
            >
              <circle
                cx="250"
                cy="295"
                r="10"
                className={cn(
                  "transition-all duration-300",
                  selectedId === "gate-d"
                    ? "fill-warning stroke-white stroke-2"
                    : "fill-secondary stroke-border group-hover:fill-secondary-foreground/20 group-focus-visible:fill-warning group-focus-visible:stroke-white group-focus-visible:stroke-2",
                )}
              />
              <text
                x="250"
                y="298"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                className="fill-foreground group-focus-visible:fill-background"
              >
                D
              </text>
              <text
                x="250"
                y="315"
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="currentColor"
                opacity="0.65"
              >
                Gate D
              </text>
            </g>

            {/* Inner icons to signal food stalls */}
            <g className="pointer-events-none" opacity="0.8">
              <circle
                cx="250"
                cy="120"
                r="8"
                fill="white"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <text x="250" y="123" textAnchor="middle" fontSize="8">
                🍔
              </text>

              <circle
                cx="160"
                cy="165"
                r="8"
                fill="white"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <text x="160" y="168" textAnchor="middle" fontSize="8">
                ☕
              </text>

              <circle
                cx="210"
                cy="245"
                r="8"
                fill="white"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <text x="210" y="248" textAnchor="middle" fontSize="8">
                🍺
              </text>
            </g>
          </svg>
          <div className="mt-2 text-[10px] text-muted-foreground text-center">
            Protip: Click the colored circles (Gates A-D), side lots, or inner quadrants to inspect
            live details.
          </div>
        </div>

        {/* Selected Section Details Column */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {selected.type === "gate" && <Compass className="h-4 w-4 text-primary" />}
                  {selected.type === "food" && <Utensils className="h-4 w-4 text-accent" />}
                  {selected.type === "parking" && <Car className="h-4 w-4 text-success" />}
                  <span>{selected.type} overview</span>
                </div>
                <h4 className="mt-1 text-lg font-bold tracking-tight">{selected.name}</h4>
              </div>
              <span
                className={cn(
                  "pill font-bold text-xs",
                  selected.status === "Normal" && "bg-success/15 text-success",
                  selected.status === "Open" && "bg-success/15 text-success",
                  selected.status === "Busy" && "bg-warning/20 text-warning-foreground",
                  selected.status === "Filling Fast" && "bg-warning/20 text-warning-foreground",
                  selected.status === "Congested" && "bg-destructive/15 text-destructive",
                )}
              >
                {selected.status}
              </span>
            </div>

            {/* Metric Box */}
            <div className="rounded-2xl bg-secondary/50 p-4 border border-border">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {selected.metricLabel}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-foreground">
                {selected.metric}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2.5">
              <div className="text-sm leading-relaxed text-foreground/80">{selected.desc}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-4.5 w-4.5 text-muted-foreground" />
                <span>{selected.location}</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="mt-6 pt-4 border-t border-border space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Recommended Shortcuts
            </div>
            <div className="grid gap-2">
              {selected.actionLink && (
                <Link
                  to={selected.actionLink}
                  className="flex items-center justify-between rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.01]"
                >
                  <span className="flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    <span>{selected.actionText}</span>
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {selected.type === "gate" && (
                <Link
                  to="/nfc"
                  className="flex items-center justify-between rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="h-4 w-4" />
                    <span>Get Wayfinding Route here</span>
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <div className="grid grid-cols-2 gap-2">
                {SECTIONS.filter((s) => s.type === selected.type && s.id !== selected.id)
                  .slice(0, 2)
                  .map((other) => (
                    <button
                      key={other.id}
                      onClick={() => setSelectedId(other.id)}
                      className="text-left rounded-xl bg-secondary/50 px-3 py-2 text-xs hover:bg-secondary border border-border/40 transition-colors truncate"
                    >
                      Inspect {other.name.split(" ")[0]} {other.name.split(" ")[1] || ""}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
