import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Ticket,
  Zap,
  Droplet,
  Users,
  Shield,
  Clock,
  LayoutGrid,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StadiumEvent {
  id: string;
  title: string;
  type: "match" | "concert" | "athletics";
  date: number; // Day of July 2026
  time: string;
  attendance: number;
  forecast: {
    powerPeak: number; // MW
    waterRate: number; // L/s
    guardsNeeded: number; // count
    concessionsActive: number; // %
  };
}

const EVENTS: StadiumEvent[] = [
  {
    id: "evt-01",
    title: "Arsenal vs. Chelsea (London Derby)",
    type: "match",
    date: 19,
    time: "15:00 BST",
    attendance: 60000,
    forecast: {
      powerPeak: 4.8,
      waterRate: 14.5,
      guardsNeeded: 350,
      concessionsActive: 100,
    },
  },
  {
    id: "evt-02",
    title: "Cosmic Horizon (Rock Concert Live)",
    type: "concert",
    date: 22,
    time: "19:30 BST",
    attendance: 55000,
    forecast: {
      powerPeak: 5.6, // Higher due to high stage power/lasers/sound arrays
      waterRate: 11.2,
      guardsNeeded: 420, // Concerts require heavier security presence
      concessionsActive: 90,
    },
  },
  {
    id: "evt-03",
    title: "Athletics Regional Championships",
    type: "athletics",
    date: 25,
    time: "10:00 BST",
    attendance: 25000,
    forecast: {
      powerPeak: 2.2,
      waterRate: 6.5,
      guardsNeeded: 150,
      concessionsActive: 40,
    },
  },
  {
    id: "evt-04",
    title: "Neon Nights (Pop Symphony Fest)",
    type: "concert",
    date: 29,
    time: "18:00 BST",
    attendance: 58000,
    forecast: {
      powerPeak: 5.2,
      waterRate: 12.8,
      guardsNeeded: 390,
      concessionsActive: 95,
    },
  },
];

export function EventCalendar() {
  const [selectedDay, setSelectedDay] = useState<number>(18); // Default to current day July 18, 2026
  const [showForecastOverlay, setShowForecastOverlay] = useState(true);

  // Calendar parameters for July 2026
  // July 1, 2026 is a Wednesday
  const startOffset = 2; // 0=Mon, 1=Tue, 2=Wed
  const totalDays = 31;

  // Construct standard calendar days array
  const calendarDays: { day: number | null; event?: StadiumEvent }[] = [];

  // Padding for starting offset
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push({ day: null });
  }

  // Populate days 1-31
  for (let d = 1; d <= totalDays; d++) {
    const event = EVENTS.find((e) => e.date === d);
    calendarDays.push({ day: d, event });
  }

  const activeEvent = EVENTS.find((e) => e.date === selectedDay);

  return (
    <div id="event-planning-calendar" className="grid gap-6 lg:grid-cols-12">
      {/* Calendar Grid & Controls */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-primary" />
                Stadium Operations Calendar
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                July 2026 Scheduler. Click a day to check event logs and project grid resource
                forecasting.
              </p>
            </div>

            {/* Toggle Overlay Button */}
            <button
              onClick={() => setShowForecastOverlay((prev) => !prev)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all flex items-center gap-1.5",
                showForecastOverlay
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-secondary border-border/60 text-muted-foreground hover:bg-secondary/80",
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {showForecastOverlay ? "Forecast Overlay: ON" : "Forecast Overlay: OFF"}
            </button>
          </div>

          {/* Calendar Table Layout */}
          <div className="border border-border/40 rounded-2xl overflow-hidden bg-[#0c0d12]/60">
            {/* Header row */}
            <div className="grid grid-cols-7 border-b border-border/40 bg-[#0c0d12]/90 text-center py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 text-xs font-mono">
              {calendarDays.map((cell, i) => {
                const isSelected = cell.day === selectedDay;
                const hasEvent = cell.event !== undefined;
                const isCurrent = cell.day === 18; // July 18 is current date in system logs

                if (cell.day === null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="aspect-square border-r border-b border-border/20 bg-secondary/10 opacity-30"
                    />
                  );
                }

                return (
                  <div
                    key={`day-${cell.day}`}
                    onClick={() => cell.day && setSelectedDay(cell.day)}
                    className={cn(
                      "aspect-square border-r border-b border-border/20 p-2 cursor-pointer hover:bg-secondary/40 transition-all flex flex-col justify-between relative",
                      isSelected && "bg-primary/5 border-primary/50",
                      isCurrent && "border-double border-2 border-accent",
                    )}
                  >
                    {/* Day Number */}
                    <div className="flex justify-between items-start">
                      <span
                        className={cn(
                          "text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center",
                          isSelected && "bg-primary text-primary-foreground",
                          isCurrent &&
                            !isSelected &&
                            "bg-accent/15 text-accent-foreground font-bold",
                        )}
                      >
                        {cell.day}
                      </span>

                      {/* Event Dot Marker */}
                      {hasEvent && (
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            cell.event?.type === "match"
                              ? "bg-primary"
                              : cell.event?.type === "concert"
                                ? "bg-accent"
                                : "bg-cyan-400",
                          )}
                        />
                      )}
                    </div>

                    {/* Brief Label or Resource Forecast Indicator */}
                    <div className="text-[8px] leading-tight">
                      {hasEvent && !showForecastOverlay && (
                        <div className="text-foreground font-semibold truncate bg-secondary/30 px-1 py-0.5 rounded mt-1 font-sans">
                          {cell.event?.type === "match" ? "Match Day" : "Concert"}
                        </div>
                      )}

                      {/* Power and Water Forecast indicators */}
                      {hasEvent && showForecastOverlay && (
                        <div className="space-y-0.5 mt-1">
                          <div className="flex items-center gap-0.5 text-blue-400 font-bold">
                            <Zap className="h-2 w-2" />
                            {cell.event?.forecast.powerPeak}MW
                          </div>
                          <div className="flex items-center gap-0.5 text-cyan-400 font-bold">
                            <Droplet className="h-2 w-2" />
                            {cell.event?.forecast.waterRate}L/s
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Sidebar Details */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        {activeEvent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-border bg-surface-elevated p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <Ticket
                  className={cn(
                    "h-4 w-4",
                    activeEvent.type === "match" ? "text-primary" : "text-accent",
                  )}
                />
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Event Logistics Details
                </span>
              </div>
              <h4 className="font-semibold text-sm text-foreground mt-3 leading-snug">
                {activeEvent.title}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> July {activeEvent.date}, 2026 ({activeEvent.time})
                </span>
              </div>
            </div>

            {/* Attendance Progress indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground font-bold flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" /> Target Attendance
                </span>
                <span className="font-mono font-bold text-foreground">
                  {activeEvent.attendance.toLocaleString()} / 60,000 Capacity
                </span>
              </div>
              <div className="h-1.5 bg-[#0c0d12] rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    activeEvent.type === "match" ? "bg-primary" : "bg-accent",
                  )}
                  style={{ width: `${(activeEvent.attendance / 60000) * 100}%` }}
                />
              </div>
            </div>

            {/* Predictive resource forecast metrics */}
            <div className="space-y-2.5 pt-2.5 border-t border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">
                Event-Specific Resource Demand Forecast
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* Power Peak Draw */}
                <div className="rounded-2xl border border-border/40 bg-secondary/15 p-3 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-blue-400" /> Elec. Peak
                  </span>
                  <div className="text-lg font-bold font-mono text-blue-400 mt-1">
                    {activeEvent.forecast.powerPeak} <span className="text-xs font-normal">MW</span>
                  </div>
                  <span className="text-[8px] text-muted-foreground mt-1">
                    Contract limit: 5.0 MW
                  </span>
                </div>

                {/* Water demand */}
                <div className="rounded-2xl border border-border/40 bg-secondary/15 p-3 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Droplet className="h-3 w-3 text-cyan-400" /> Water Flow
                  </span>
                  <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                    {activeEvent.forecast.waterRate}{" "}
                    <span className="text-xs font-normal">L/s</span>
                  </div>
                  <span className="text-[8px] text-muted-foreground mt-1">
                    halftime capacity safe
                  </span>
                </div>

                {/* Guard staffing */}
                <div className="rounded-2xl border border-border/40 bg-secondary/15 p-3 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3 text-primary" /> Guard Staff
                  </span>
                  <div className="text-lg font-bold font-mono text-primary mt-1">
                    {activeEvent.forecast.guardsNeeded}{" "}
                    <span className="text-xs font-normal">heads</span>
                  </div>
                  <span className="text-[8px] text-muted-foreground mt-1">
                    Perimeter Gates fully active
                  </span>
                </div>

                {/* Concessions */}
                <div className="rounded-2xl border border-border/40 bg-secondary/15 p-3 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3 text-warning" /> Food Outlets
                  </span>
                  <div className="text-lg font-bold font-mono text-warning mt-1">
                    {activeEvent.forecast.concessionsActive}%
                  </div>
                  <span className="text-[8px] text-muted-foreground mt-1">
                    concourse networks live
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-muted-foreground bg-secondary/10 rounded-xl p-2.5 leading-relaxed">
              Note: Demand projections utilize weather forecast and match ticket tiers to preempt
              grid spikes. All local substations pre-notified.
            </div>
          </motion.div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground min-h-[300px] flex flex-col items-center justify-center">
            <Ticket className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h4 className="text-xs font-semibold">No Match/Concert on Day {selectedDay}</h4>
            <p className="text-[10px] text-muted-foreground/70 max-w-[200px] mt-1 leading-relaxed">
              This day contains no events. Please select July 19th, 22nd, 25th, or 29th on the
              scheduler grid to review resource forecasting maps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
