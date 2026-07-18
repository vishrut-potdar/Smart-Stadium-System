import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Compass,
  Zap,
  Accessibility,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  MapPin,
  Sparkles,
  Search,
  Check,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ParkingZone {
  id: string;
  name: string;
  location: string;
  totalSpots: number;
  occupiedSpots: number;
  accessibleSpots: { total: number; available: number };
  evChargingSpots: { total: number; available: number };
  congestion: "Low" | "Moderate" | "Heavy" | "Critical";
  fee: string;
}

export function ParkingTracker() {
  const [zones, setZones] = useState<ParkingZone[]>([
    {
      id: "pk-alpha",
      name: "Zone Alpha (North Lot)",
      location: "Adjacent to Gate A Ingress",
      totalSpots: 850,
      occupiedSpots: 642,
      accessibleSpots: { total: 40, available: 12 },
      evChargingSpots: { total: 20, available: 6 },
      congestion: "Moderate",
      fee: "$25.00",
    },
    {
      id: "pk-beta",
      name: "Zone Beta (South Lot)",
      location: "Near Gate B Security Point",
      totalSpots: 1200,
      occupiedSpots: 1118,
      accessibleSpots: { total: 50, available: 2 },
      evChargingSpots: { total: 30, available: 1 },
      congestion: "Critical",
      fee: "$25.00",
    },
    {
      id: "pk-gamma",
      name: "Zone Gamma (VIP / West)",
      location: "Direct Access to West Club Suites",
      totalSpots: 350,
      occupiedSpots: 215,
      accessibleSpots: { total: 15, available: 8 },
      evChargingSpots: { total: 15, available: 9 },
      congestion: "Low",
      fee: "$50.00",
    },
    {
      id: "pk-delta",
      name: "Zone Delta (East Overflow)",
      location: "10-minute shuttle ride to East Tunnel",
      totalSpots: 1500,
      occupiedSpots: 450,
      accessibleSpots: { total: 60, available: 44 },
      evChargingSpots: { total: 10, available: 8 },
      congestion: "Low",
      fee: "$15.00",
    },
  ]);

  const [ticketSection, setTicketSection] = useState<string>("104");
  const [reservedZone, setReservedZone] = useState<string | null>(null);

  const handleSimulateTraffic = () => {
    setZones((prev) =>
      prev.map((zone) => {
        // Generate random changes in occupancy
        const delta = Math.floor(Math.random() * 21) - 10; // -10 to +10 cars
        const newOccupied = Math.max(
          100,
          Math.min(zone.totalSpots - 10, zone.occupiedSpots + delta),
        );

        // update accessible / EV
        const accAvail = Math.max(
          0,
          Math.min(
            zone.accessibleSpots.total,
            zone.accessibleSpots.available + (Math.random() > 0.5 ? 1 : -1),
          ),
        );
        const evAvail = Math.max(
          0,
          Math.min(
            zone.evChargingSpots.total,
            zone.evChargingSpots.available + (Math.random() > 0.5 ? 1 : -1),
          ),
        );

        // Congestion adjustment based on occupancy %
        const occupancyRate = newOccupied / zone.totalSpots;
        let congestion: ParkingZone["congestion"] = "Low";
        if (occupancyRate > 0.9) congestion = "Critical";
        else if (occupancyRate > 0.75) congestion = "Heavy";
        else if (occupancyRate > 0.5) congestion = "Moderate";

        return {
          ...zone,
          occupiedSpots: newOccupied,
          accessibleSpots: { ...zone.accessibleSpots, available: accAvail },
          evChargingSpots: { ...zone.evChargingSpots, available: evAvail },
          congestion,
        };
      }),
    );
    toast.success("Live parking grid coordinates re-indexed!");
  };

  const handleReserveSpot = (zoneName: string) => {
    setReservedZone(zoneName);
    toast.success(
      `Parking reservation confirmed in ${zoneName}! Your Digital entry ticket has been updated.`,
    );
  };

  // Recommendations mapping
  const getRecommendation = () => {
    if (ticketSection === "104") {
      return {
        bestZone: "Zone Alpha (North Lot)",
        reason:
          "Direct access to Gate A (North Stand). Saving approx. 12 minutes on entry pathing.",
        time: "4-minute walk",
        zoneId: "pk-alpha",
      };
    }
    if (ticketSection === "204") {
      return {
        bestZone: "Zone Delta (East Overflow)",
        reason:
          "Zone Beta (South) is currently at 93% congestion limit. East Lot offers quick shuttles direct to East Tunnel.",
        time: "10-minute shuttle",
        zoneId: "pk-delta",
      };
    }
    if (ticketSection === "302") {
      return {
        bestZone: "Zone Delta (East Overflow)",
        reason:
          "Shortest queue path to Section 301-306 commentary gallery via East Tunnel corridor.",
        time: "6-minute walking line",
        zoneId: "pk-delta",
      };
    }
    // VIP / West Stand
    return {
      bestZone: "Zone Gamma (VIP / West)",
      reason: "Direct executive club entry elevator connecting straight to VIP Suites.",
      time: "2-minute direct escalator",
      zoneId: "pk-gamma",
    };
  };

  const recommendation = getRecommendation();

  return (
    <div id="parking-occupancy-dashboard" className="grid gap-6 lg:grid-cols-12">
      {/* LEFT COLUMN: Parking Lots Grid (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Header telemetry and Simulate bar */}
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/40 pb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Car className="h-4.5 w-4.5 text-primary" />
                Dynamic Parking Occupancy & Ingress Tracker
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Displays live occupancy levels across stadium parking sectors to optimize
                surrounding traffic flows.
              </p>
            </div>
            <button
              onClick={handleSimulateTraffic}
              className="flex items-center gap-1.5 rounded-xl bg-secondary hover:bg-secondary/80 px-3.5 py-2 text-xs font-semibold transition-all shrink-0 self-start"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin-slow" />
              Simulate Ingress Flow
            </button>
          </div>

          {/* Cards of parking zones */}
          <div className="grid gap-4 sm:grid-cols-2">
            {zones.map((zone) => {
              const occupancyPct = Math.round((zone.occupiedSpots / zone.totalSpots) * 100);
              const spotsAvailable = zone.totalSpots - zone.occupiedSpots;

              return (
                <div
                  key={zone.id}
                  className={cn(
                    "rounded-2xl border bg-[#0c0d12]/10 p-4.5 space-y-3.5 transition-all hover:border-primary/40 flex flex-col justify-between",
                    zone.congestion === "Critical"
                      ? "border-destructive/40 bg-destructive/5"
                      : zone.congestion === "Heavy"
                        ? "border-warning/30"
                        : "border-border/60",
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          {zone.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground block mt-0.5 leading-normal">
                          {zone.location}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "pill text-[9px] font-bold uppercase",
                          zone.congestion === "Low"
                            ? "bg-success/15 text-success"
                            : zone.congestion === "Moderate"
                              ? "bg-primary/15 text-primary"
                              : zone.congestion === "Heavy"
                                ? "bg-warning/15 text-warning"
                                : "bg-destructive/15 text-destructive animate-pulse",
                        )}
                      >
                        {zone.congestion} Traffic
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-secondary/30 rounded-xl p-2.5 mt-3">
                      <div className="flex items-center gap-1">
                        <Accessibility className="h-3.5 w-3.5 text-primary" />
                        <div>
                          <span className="text-muted-foreground block text-[8px]">ACCESSIBLE</span>
                          <span className="font-bold text-foreground block mt-0.5">
                            {zone.accessibleSpots.available} / {zone.accessibleSpots.total} Open
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-warning" />
                        <div>
                          <span className="text-muted-foreground block text-[8px]">EV CHARGER</span>
                          <span className="font-bold text-foreground block mt-0.5">
                            {zone.evChargingSpots.available} / {zone.evChargingSpots.total} Open
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                      <span>Occupancy: {occupancyPct}% full</span>
                      <span>
                        {spotsAvailable} / {zone.totalSpots} spots free
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          occupancyPct > 90
                            ? "bg-destructive"
                            : occupancyPct > 75
                              ? "bg-warning"
                              : "bg-success",
                        )}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="text-[10px] font-mono font-bold text-primary">
                      Rate: {zone.fee}
                    </span>
                    <button
                      onClick={() => handleReserveSpot(zone.name)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all border flex items-center gap-1.5",
                        reservedZone === zone.name
                          ? "bg-success/15 border-success text-success"
                          : "bg-secondary hover:bg-secondary/80 border-border",
                      )}
                    >
                      {reservedZone === zone.name ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Booked
                        </>
                      ) : (
                        "Reserve Spot"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Smart Routing Recommendations (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Smart Parking Lot Suggestion Engine */}
        <div className="rounded-3xl border border-border bg-surface-elevated p-5 space-y-4">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Smart Parking Assistant
          </span>

          <div className="space-y-3.5">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1.5">
                Input Seating Section
              </label>
              <select
                value={ticketSection}
                onChange={(e) => setTicketSection(e.target.value)}
                className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
              >
                <option value="104">Section 104 (North Stand)</option>
                <option value="204">Section 204 (South Stand)</option>
                <option value="302">Section 302 (East Stand)</option>
                <option value="VIP">VIP Suite 12 (West Stand)</option>
              </select>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Compass className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase">
                    RECOMMENDED PARKING
                  </span>
                  <h4 className="font-bold text-xs text-foreground">{recommendation.bestZone}</h4>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                {recommendation.reason}
              </p>

              <div className="flex items-center gap-1 text-[10px] text-foreground font-mono font-bold bg-secondary/40 rounded-lg p-2">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                <span>ETA: {recommendation.time} to seat</span>
              </div>
            </div>

            <button
              onClick={() => handleReserveSpot(recommendation.bestZone)}
              className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-xs transition-all hover:bg-primary/90 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Pre-Book Recommended
            </button>
          </div>
        </div>

        {/* Dynamic Reservation Pass Card */}
        {reservedZone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-success/30 bg-success/5 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-success tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reservation Active
              </span>
              <span className="text-[8px] font-mono text-success/80 font-bold">#PK-2026-X8</span>
            </div>

            <div className="space-y-2 text-center py-2 border-y border-success/10">
              <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                RESERVED SECTOR
              </span>
              <h4 className="font-bold text-sm text-foreground">{reservedZone}</h4>
              <p className="text-[9px] text-muted-foreground">
                Authorized digital entry code synced. Show code to lot attendant.
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => toast.success("Parking receipt downloaded to device")}
                className="text-[10px] font-bold text-success hover:underline flex items-center gap-1"
              >
                Download Receipt
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
