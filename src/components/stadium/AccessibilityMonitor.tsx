import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accessibility,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Users,
  Compass,
  ArrowRight,
  UserCheck,
  Send,
  PhoneCall,
  FlameKindling,
  Timer,
  RefreshCw,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Elevator {
  id: string;
  name: string;
  location: string;
  status: "online" | "service" | "offline";
  load: number;
  temp: number;
  lastMaintenance: string;
}

interface AccessibleSeatZone {
  id: string;
  name: string;
  total: number;
  occupied: number;
  nearestElevator: string;
}

interface SupportRequest {
  id: string;
  attendeeName: string;
  seat: string;
  type: "escort" | "wheelchair" | "medical" | "lift";
  status: "pending" | "dispatched" | "resolved";
  timeReceived: string;
  urgency: "routine" | "urgent" | "critical";
}

export function AccessibilityMonitor() {
  const [elevators, setElevators] = useState<Elevator[]>([
    {
      id: "elv-01",
      name: "Elevator 1 (North)",
      location: "Gate A Concours",
      status: "online",
      load: 38,
      temp: 21.4,
      lastMaintenance: "2026-06-15",
    },
    {
      id: "elv-02",
      name: "Elevator 2 (South)",
      location: "Gate B General Lobby",
      status: "service",
      load: 0,
      temp: 24.1,
      lastMaintenance: "2026-07-18",
    },
    {
      id: "elv-03",
      name: "Elevator 3 (West)",
      location: "VIP Club & Suites",
      status: "online",
      load: 72,
      temp: 20.8,
      lastMaintenance: "2026-07-02",
    },
    {
      id: "elv-04",
      name: "Elevator 4 (East)",
      location: "Press Box Ascent",
      status: "online",
      load: 12,
      temp: 22.1,
      lastMaintenance: "2026-05-20",
    },
  ]);

  const [seatingZones, setSeatingZones] = useState<AccessibleSeatZone[]>([
    {
      id: "sz-01",
      name: "North Stand Lower (Section 102WC)",
      total: 12,
      occupied: 8,
      nearestElevator: "Elevator 1",
    },
    {
      id: "sz-02",
      name: "South Stand Lower (Section 204WC)",
      total: 16,
      occupied: 14,
      nearestElevator: "Elevator 2 (In Service)",
    },
    {
      id: "sz-03",
      name: "East Stand Mid (Section 302WC)",
      total: 10,
      occupied: 4,
      nearestElevator: "Elevator 4",
    },
    {
      id: "sz-04",
      name: "West Stand VIP Club Suite WC",
      total: 8,
      occupied: 3,
      nearestElevator: "Elevator 3",
    },
  ]);

  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([
    {
      id: "req-01",
      attendeeName: "Sarah Jenkins",
      seat: "Section 102WC, Row A",
      type: "wheelchair",
      status: "pending",
      timeReceived: "05:01",
      urgency: "routine",
    },
    {
      id: "req-02",
      attendeeName: "Marcus Vance",
      seat: "Gate B Ingress Turnstile",
      type: "escort",
      status: "dispatched",
      timeReceived: "04:58",
      urgency: "urgent",
    },
    {
      id: "req-03",
      attendeeName: "Robert Miller",
      seat: "Section 204WC, Bay 3",
      type: "medical",
      status: "resolved",
      timeReceived: "04:45",
      urgency: "critical",
    },
  ]);

  // Simulation support
  const [newAttendee, setNewAttendee] = useState("");
  const [newSeat, setNewSeat] = useState("");
  const [newType, setNewType] = useState<"escort" | "wheelchair" | "medical" | "lift">(
    "wheelchair",
  );
  const [newUrgency, setNewUrgency] = useState<"routine" | "urgent" | "critical">("routine");

  const simulateElevatorLoad = () => {
    setElevators((prev) =>
      prev.map((el) => {
        if (el.status !== "online") return el;
        const delta = Math.floor(Math.random() * 21) - 10;
        const newLoad = Math.max(5, Math.min(95, el.load + delta));
        return {
          ...el,
          load: newLoad,
          temp: Number((el.temp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        };
      }),
    );
    toast.success("Elevator telemetry updated");
  };

  const handleBookSpot = (zoneId: string) => {
    setSeatingZones((prev) =>
      prev.map((zone) => {
        if (zone.id === zoneId) {
          if (zone.occupied >= zone.total) {
            toast.error("Zone has reached maximum wheelchair bay capacity");
            return zone;
          }
          toast.success(`Reserved accessible bay in ${zone.name}`);
          return { ...zone, occupied: zone.occupied + 1 };
        }
        return zone;
      }),
    );
  };

  const handleUpdateStatus = (reqId: string, nextStatus: "dispatched" | "resolved") => {
    setSupportRequests((prev) =>
      prev.map((req) => {
        if (req.id === reqId) {
          return { ...req, status: nextStatus };
        }
        return req;
      }),
    );
    toast.success(`Request status updated to: ${nextStatus.toUpperCase()}`);
  };

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendee.trim() || !newSeat.trim()) {
      toast.error("Please fill out attendee name and current location");
      return;
    }

    const newReq: SupportRequest = {
      id: `req-${Date.now()}`,
      attendeeName: newAttendee,
      seat: newSeat,
      type: newType,
      status: "pending",
      timeReceived: "05:02",
      urgency: newUrgency,
    };

    setSupportRequests((prev) => [newReq, ...prev]);
    setNewAttendee("");
    setNewSeat("");
    toast.success("Mobility Support Dispatch Ticket created!");
  };

  return (
    <div id="accessibility-monitor-dashboard" className="grid gap-6 lg:grid-cols-12">
      {/* LEFT: Elevator Systems and Accessible Seating Bays (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Elevator Core Status Grid */}
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border/40 pb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Gauge className="h-4.5 w-4.5 text-primary" />
                Heavy Utility Lift & Elevator Systems
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitoring lift weights, temperature sensors, and vertical shaft motor health.
              </p>
            </div>
            <button
              onClick={simulateElevatorLoad}
              className="flex items-center gap-1.5 rounded-xl bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-semibold transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary" />
              Update Telemetry
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {elevators.map((elv) => (
              <div
                key={elv.id}
                className={cn(
                  "rounded-2xl border bg-secondary/20 p-4 space-y-3.5 transition-all hover:border-primary/40",
                  elv.status === "service" ? "border-warning/30 bg-warning/5" : "border-border/60",
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">{elv.name}</h4>
                    <span className="text-[10px] text-muted-foreground">{elv.location}</span>
                  </div>
                  <span
                    className={cn(
                      "pill text-[9px] font-bold uppercase",
                      elv.status === "online"
                        ? "bg-success/15 text-success"
                        : elv.status === "service"
                          ? "bg-warning/15 text-warning animate-pulse"
                          : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {elv.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-secondary/30 rounded-xl p-2.5">
                  <div>
                    <span className="text-muted-foreground">Shaft Temp:</span>
                    <span className="block font-bold text-foreground mt-0.5">{elv.temp} °C</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Load Limit:</span>
                    <span className="block font-bold text-foreground mt-0.5">
                      {elv.load}% Capacity
                    </span>
                  </div>
                  <div className="col-span-2 border-t border-border/20 pt-1.5 mt-1">
                    <span className="text-muted-foreground">Last Maintenance:</span>
                    <span className="block text-foreground/80 mt-0.5">{elv.lastMaintenance}</span>
                  </div>
                </div>

                {/* Progress bar for Load Limit */}
                {elv.status === "online" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase">
                      <span>Safety Margin</span>
                      <span>{100 - elv.load}% remaining</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          elv.load > 85
                            ? "bg-destructive"
                            : elv.load > 60
                              ? "bg-warning"
                              : "bg-success",
                        )}
                        style={{ width: `${elv.load}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Accessible Seating Grid */}
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Accessibility className="h-4.5 w-4.5 text-primary" />
              Wheelchair-Accessible Seating & Bay Allocations
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time reservation statuses and physical lift connections for accessibility bays.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {seatingZones.map((zone) => {
              const pct = Math.round((zone.occupied / zone.total) * 100);
              const isFull = zone.occupied >= zone.total;
              return (
                <div
                  key={zone.id}
                  className="rounded-2xl border border-border/60 bg-secondary/15 p-4 flex flex-col justify-between space-y-3.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground leading-normal">
                        {zone.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        Nearest Lift: {zone.nearestElevator}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-bold font-mono pill",
                        isFull
                          ? "bg-destructive/15 text-destructive"
                          : "bg-success/15 text-success",
                      )}
                    >
                      {zone.total - zone.occupied} Free
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                      <span>Occupation Rate</span>
                      <span>
                        {zone.occupied} / {zone.total} bays ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          pct > 85 ? "bg-destructive" : pct > 60 ? "bg-warning" : "bg-success",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookSpot(zone.id)}
                    disabled={isFull}
                    className={cn(
                      "w-full rounded-xl py-2 text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5",
                      isFull
                        ? "bg-secondary text-muted-foreground cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground",
                    )}
                  >
                    <Accessibility className="h-3.5 w-3.5" />
                    Book Free Bay
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Active Mobility Support Ticket Logs (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Log Support Ticket Request Form */}
        <div className="rounded-3xl border border-border bg-surface-elevated p-5 space-y-4">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
            <PhoneCall className="h-3.5 w-3.5" /> Dispatch Mobility Escort
          </span>
          <h4 className="font-semibold text-xs text-foreground mt-1">Manual Assistance Ticket</h4>

          <form onSubmit={handleAddRequest} className="space-y-3 pt-1">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                Attendee Name
              </label>
              <input
                type="text"
                placeholder="e.g., Jonathan Reed"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                Seating Section / Gate Location
              </label>
              <input
                type="text"
                placeholder="e.g., Gate B Turnstiles"
                value={newSeat}
                onChange={(e) => setNewSeat(e.target.value)}
                className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  Assistance Type
                </label>
                <select
                  value={newType}
                  onChange={(e) =>
                    setNewType(e.target.value as "escort" | "wheelchair" | "medical" | "lift")
                  }
                  className="w-full bg-secondary border border-border/60 rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="wheelchair">Wheelchair Req</option>
                  <option value="escort">Physical Escort</option>
                  <option value="lift">Lift Access</option>
                  <option value="medical">Medical Check</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  Urgency
                </label>
                <select
                  value={newUrgency}
                  onChange={(e) =>
                    setNewUrgency(e.target.value as "routine" | "urgent" | "critical")
                  }
                  className="w-full bg-secondary border border-border/60 rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-xs transition-all hover:bg-primary/90 mt-2 flex items-center justify-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Dispatch Attendant
            </button>
          </form>
        </div>

        {/* Real-time Support Requests log */}
        <div className="rounded-3xl border border-border bg-surface-elevated p-5 space-y-4">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Live Support Ticket Logs
          </span>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {supportRequests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "rounded-2xl border bg-[#0c0d12]/20 p-3.5 space-y-3 relative overflow-hidden transition-all",
                    req.status === "resolved"
                      ? "border-border/30 opacity-60"
                      : req.urgency === "critical"
                        ? "border-destructive/40 bg-destructive/5"
                        : req.urgency === "urgent"
                          ? "border-warning/30"
                          : "border-border/60",
                  )}
                >
                  {/* Urgency flash bar */}
                  {req.status !== "resolved" && (
                    <div
                      className={cn(
                        "absolute top-0 bottom-0 left-0 w-1",
                        req.urgency === "critical"
                          ? "bg-destructive animate-pulse"
                          : req.urgency === "urgent"
                            ? "bg-warning"
                            : "bg-primary",
                      )}
                    />
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-semibold text-xs text-foreground flex items-center gap-1">
                        {req.attendeeName}
                        <span
                          className={cn(
                            "text-[8px] font-mono uppercase font-bold pill",
                            req.urgency === "critical"
                              ? "bg-destructive/15 text-destructive"
                              : req.urgency === "urgent"
                                ? "bg-warning/15 text-warning"
                                : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {req.urgency}
                        </span>
                      </h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{req.seat}</p>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground font-bold">
                      {req.timeReceived}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] bg-secondary/30 rounded-xl px-2.5 py-1.5 font-mono">
                    <span className="text-muted-foreground capitalize">Req: {req.type}</span>
                    <span
                      className={cn(
                        "capitalize font-bold",
                        req.status === "resolved"
                          ? "text-success"
                          : req.status === "dispatched"
                            ? "text-primary"
                            : "text-warning",
                      )}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.status !== "resolved" && (
                    <div className="flex gap-1.5 pt-1">
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "dispatched")}
                          className="flex-1 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold text-[9px] py-1.5 transition-all text-center flex items-center justify-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Dispatch Crew
                        </button>
                      )}
                      {req.status === "dispatched" && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "resolved")}
                          className="flex-1 rounded-xl bg-success/10 border border-success/20 hover:bg-success/20 text-success font-bold text-[9px] py-1.5 transition-all text-center flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
