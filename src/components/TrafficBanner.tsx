import { useState, useEffect } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, X, Clock, Compass, Car } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerAlert = {
  id: string;
  type: "congestion" | "traffic" | "parking" | "weather";
  severity: "high" | "medium" | "info";
  gate?: string;
  title: string;
  body: string;
};

const TRAFFIC_ALERTS: BannerAlert[] = [
  {
    id: "gate-c-alert",
    type: "congestion",
    severity: "high",
    gate: "Gate C",
    title: "Gate C Congestion Alert",
    body: "Heavy security queue at Gate C (35 min wait). Fans are strongly advised to re-route to Gate A or B (under 5 min wait).",
  },
  {
    id: "parking-south",
    type: "parking",
    severity: "high",
    title: "South Parking Lot Full",
    body: "South Parking Lot has reached 98% capacity. Please park at the North Plaza or East Lot, where spaces are still available.",
  },
  {
    id: "transit-shuttle",
    type: "traffic",
    severity: "info",
    title: "Metro Shuttle Frequency Boost",
    body: "Metro transit shuttles to and from Arena Grand have been doubled. Buses departing every 3 mins from the West Transit Hub.",
  },
  {
    id: "gate-d-status",
    type: "congestion",
    severity: "medium",
    gate: "Gate D",
    title: "Gate D Lane Reduction",
    body: "Lane 4 at Gate D is temporarily closed for scanner maintenance. Expect minor delays of 10-15 mins.",
  },
  {
    id: "weather-roof",
    type: "weather",
    severity: "medium",
    title: "Approaching Showers",
    body: "Light rain expected in 15 mins. Stadium roof closure sequence has initiated. No action required for fans in lower stands.",
  },
];

export function TrafficBanner() {
  const [index, setIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isDismissed || isExpanded) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TRAFFIC_ALERTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isDismissed, isExpanded]);

  if (isDismissed) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-3">
        <button
          onClick={() => setIsDismissed(false)}
          className="flex items-center gap-2 rounded-full bg-warning/20 border border-warning/30 px-3.5 py-1.5 text-xs font-medium text-warning-foreground hover:bg-warning/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
          </span>
          <span>Stadium Traffic Alerts (5 active)</span>
        </button>
      </div>
    );
  }

  const alert = TRAFFIC_ALERTS[index];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-3 transition-all duration-300">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border p-4 shadow-glass transition-all duration-300",
          alert.severity === "high" && "bg-destructive/10 border-destructive/20 text-destructive",
          alert.severity === "medium" && "bg-warning/10 border-warning/20 text-warning-foreground",
          alert.severity === "info" && "bg-accent/10 border-accent/20 text-accent",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Main alert content */}
          <div className="flex items-start gap-3 flex-1">
            <div
              className={cn(
                "mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl",
                alert.severity === "high" && "bg-destructive/20 text-destructive",
                alert.severity === "medium" && "bg-warning/20 text-warning-foreground",
                alert.severity === "info" && "bg-accent/20 text-accent",
              )}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {alert.type}
                </span>
                <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                <span className="text-[10px] font-semibold tabular-nums opacity-80">
                  Alert {index + 1} of {TRAFFIC_ALERTS.length}
                </span>
              </div>
              <h3 className="mt-0.5 text-sm font-bold tracking-tight">{alert.title}</h3>
              <p className="mt-1 text-xs text-foreground/85 leading-relaxed">{alert.body}</p>
            </div>
          </div>

          {/* Action and controls */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                alert.severity === "high" &&
                  "bg-destructive/20 hover:bg-destructive/30 border-destructive/10 text-destructive",
                alert.severity === "medium" &&
                  "bg-warning/20 hover:bg-warning/30 border-warning/10 text-warning-foreground",
                alert.severity === "info" &&
                  "bg-accent/20 hover:bg-accent/30 border-accent/10 text-accent",
              )}
            >
              {isExpanded ? "Hide Overview" : "View Live Wait Times"}
            </button>
            <div className="flex items-center rounded-full bg-black/5 dark:bg-white/5 p-0.5 border border-black/5 dark:border-white/5">
              <button
                onClick={() =>
                  setIndex((prev) => (prev - 1 + TRAFFIC_ALERTS.length) % TRAFFIC_ALERTS.length)
                }
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                aria-label="Previous alert"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIndex((prev) => (prev + 1) % TRAFFIC_ALERTS.length)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                aria-label="Next alert"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Small screen link */}
        <div className="mt-2.5 flex justify-end sm:hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold underline underline-offset-2"
          >
            {isExpanded ? "Close Overview" : "View Live Wait Times"}
          </button>
        </div>

        {/* Expandable Gate Wait Times Dashboard */}
        {isExpanded && (
          <div className="mt-4 border-t border-current/15 pt-4 transition-all duration-300">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3">
              Live Gate & Transit Dashboard
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Gate waits */}
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3 border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-75 mb-2">
                  <Compass className="h-3.5 w-3.5" /> Gate Congestion
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Gate A (North)</span>
                    <span className="font-semibold text-success">3 min wait</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gate B (West)</span>
                    <span className="font-semibold text-success">4 min wait</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gate C (East)</span>
                    <span className="font-semibold text-destructive">35 min wait</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gate D (South)</span>
                    <span className="font-semibold text-warning-foreground">15 min wait</span>
                  </div>
                </div>
              </div>

              {/* Parking */}
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3 border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-75 mb-2">
                  <Car className="h-3.5 w-3.5" /> Parking Occupancy
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span>South Parking Lot</span>
                    <span className="font-semibold text-destructive">98% full</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>North Plaza Deck</span>
                    <span className="font-semibold text-success">45% full</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>East Grass Lot</span>
                    <span className="font-semibold text-success">22% full</span>
                  </div>
                </div>
              </div>

              {/* Transit */}
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3 border border-black/5 dark:border-white/5 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-75 mb-2">
                  <Clock className="h-3.5 w-3.5" /> Transit & Shuttles
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>West Shuttle Hub</span>
                    <span className="font-semibold text-success">3m frequency</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metro Line 4</span>
                    <span className="font-semibold text-success">On time (5m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rideshare Stand</span>
                    <span className="font-semibold text-warning-foreground">High surge</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[10px] opacity-75 italic text-center sm:text-left">
              *Refresh times average 5 seconds, driven by computer vision gate counts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
