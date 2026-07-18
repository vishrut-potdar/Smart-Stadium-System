import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Thermometer,
  Percent,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  category: "HVAC" | "Lighting" | "Water" | "Power";
  health: number; // 0-100
  runtime: number; // hours
  vibration: string; // mm/s
  temperature: number; // °C
  insulation?: string; // insulation resistance
  estFailureDays: number; // Days
  severity: "critical" | "warning" | "normal";
  action: string;
}

const INITIAL_ASSETS: Asset[] = [
  {
    id: "ast-01",
    name: "HVAC Air Handler Unit 102 (North Stand)",
    category: "HVAC",
    health: 94,
    runtime: 12450,
    vibration: "1.2 mm/s",
    temperature: 42,
    estFailureDays: 125,
    severity: "normal",
    action: "Normal operations. Schedule routine dust filter replacement in 2 weeks.",
  },
  {
    id: "ast-02",
    name: "East Stand Floodlight Array (High-V Transformer)",
    category: "Lighting",
    health: 68,
    runtime: 8920,
    vibration: "N/A",
    temperature: 84, // elevated
    insulation: "12 MΩ (Limit: >50 MΩ)",
    estFailureDays: 14, // urgent
    severity: "critical",
    action:
      "Urgent! Coolant oil level low. Schedule transformer oil flushing and bushing diagnostic.",
  },
  {
    id: "ast-03",
    name: "West Stand Main Hydraulics Water Pump",
    category: "Water",
    health: 81,
    runtime: 15310,
    vibration: "3.2 mm/s (Limit: 3.5)", // high vibration
    temperature: 58,
    estFailureDays: 42,
    severity: "warning",
    action:
      "High vibration detected. Re-torque mount bolts and lubricate motor drive shaft bearings.",
  },
  {
    id: "ast-04",
    name: "Operations Core Chiller Unit 1",
    category: "HVAC",
    health: 98,
    runtime: 19420,
    vibration: "0.8 mm/s",
    temperature: 20,
    estFailureDays: 310,
    severity: "normal",
    action: "Condenser cycle completely stable. Continue standard scheduling.",
  },
];

export function PredictiveMaintenance() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(INITIAL_ASSETS[1]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const handleRunDiagnostic = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanStep("Initiating diagnostic sweep...");
    setScanLogs([
      "[INFO] Handshake with telemetry node 12A...",
      "[INFO] Calibrating transducer baselines...",
    ]);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 5;
        if (next === 20) {
          setScanStep("Analyzing HVAC Fan vibration frequencies...");
          setScanLogs((l) => [...l, "[INFO] HVAC harmonics standard. Fan RPM normal."]);
        } else if (next === 50) {
          setScanStep("Querying Floodlight Transformer oil thermal insulation...");
          setScanLogs((l) => [
            ...l,
            "[WARNING] Floodlight Transformer temp is 84°C (Limit: 85°C). High breakdown probability.",
          ]);
        } else if (next === 80) {
          setScanStep("Measuring Hydraulic pump radial bearing vibration...");
          setScanLogs((l) => [
            ...l,
            "[WARNING] Hydraulics pump structural resonance elevated at 3.2 mm/s.",
          ]);
        } else if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setScanStep("");
            setScanLogs((l) => [
              ...l,
              "[SUCCESS] Predictive sweep complete. Maintenance actions logged.",
            ]);

            // Adjust values slightly to simulate actual recalculation
            setAssets((prev) =>
              prev.map((a) => {
                if (a.id === "ast-02") {
                  return { ...a, estFailureDays: 12, health: 66, temperature: 84.5 };
                }
                return a;
              }),
            );
          }, 400);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  return (
    <div id="predictive-maintenance-dashboard" className="grid gap-6 lg:grid-cols-12">
      {/* System status checklist */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Wrench className="h-4.5 w-4.5 text-primary" />
                Equipment Failure Forecasting Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Utilizes real-time thermal profiles, rotor vibration, and runtime data to generate
                predictive Estimated Time to Failure (ETF).
              </p>
            </div>

            <button
              onClick={handleRunDiagnostic}
              disabled={isScanning}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all",
                isScanning
                  ? "bg-secondary border border-border text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm",
              )}
            >
              <Activity className={cn("h-3.5 w-3.5", isScanning && "animate-spin")} />
              {isScanning ? "Scanning Systems..." : "Run System Diagnostic Sweep"}
            </button>
          </div>

          {/* Diagnostic scanner bar */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border border-dashed border-primary/40 rounded-2xl bg-primary/[0.02] p-4 mb-4"
              >
                <div className="flex justify-between text-[10px] font-mono font-bold mb-1.5">
                  <span className="text-primary animate-pulse">{scanStep}</span>
                  <span className="text-primary">{scanProgress}%</span>
                </div>
                <div className="h-1.5 bg-[#0c0d12] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-150"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="mt-2.5 h-14 overflow-y-auto bg-black/40 rounded-lg p-2 font-mono text-[9px] text-muted-foreground/90 space-y-0.5">
                  {scanLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assets Grid List */}
          <div className="space-y-3">
            {assets.map((asset) => {
              const isCrit = asset.severity === "critical";
              const isWarn = asset.severity === "warning";
              const isSelected = selectedAsset?.id === asset.id;

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={cn(
                    "rounded-2xl border p-4 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between relative overflow-hidden",
                    isSelected
                      ? "border-primary bg-primary/[0.04]"
                      : "border-border bg-secondary/10 hover:bg-secondary/35",
                    isCrit && !isSelected && "border-destructive/40 bg-destructive/[0.01]",
                    isWarn && !isSelected && "border-warning/40 bg-warning/[0.01]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-xl p-2",
                        isCrit
                          ? "bg-destructive/15 text-destructive"
                          : isWarn
                            ? "bg-warning/15 text-warning"
                            : "bg-primary/10 text-primary",
                      )}
                    >
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">{asset.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>Runtime: {asset.runtime.toLocaleString()} hrs</span>
                        <span>·</span>
                        <span>Category: {asset.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 sm:mt-0 text-right">
                    {/* Health score percentage */}
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                        Health Index
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <span
                          className={cn(
                            "text-sm font-bold font-mono",
                            asset.health < 70
                              ? "text-destructive"
                              : asset.health < 85
                                ? "text-warning"
                                : "text-success",
                          )}
                        >
                          {asset.health}%
                        </span>
                      </div>
                    </div>

                    {/* ETF Failure Days */}
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                        ETF (Days)
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold font-mono px-2 py-0.5 rounded-md inline-block mt-0.5",
                          isCrit
                            ? "bg-destructive/15 text-destructive animate-pulse"
                            : isWarn
                              ? "bg-warning/15 text-warning"
                              : "bg-success/15 text-success",
                        )}
                      >
                        {asset.estFailureDays} Days
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asset Maintenance Inspector */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        {selectedAsset ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-border bg-surface-elevated p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-primary tracking-wider">
                <Wrench className="h-4.5 w-4.5" /> Maintenance Inspector
              </div>
              <h4 className="font-semibold text-sm mt-3 leading-snug">{selectedAsset.name}</h4>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                Asset ID: {selectedAsset.id}
              </p>
            </div>

            {/* Metrics Checklist */}
            <div className="space-y-2 border-t border-b border-border/40 py-3 font-mono text-[10px]">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Asset Category</span>
                <span className="text-foreground font-bold">{selectedAsset.category}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Operating Temp</span>
                <span
                  className={cn(
                    "font-bold",
                    selectedAsset.temperature > 80 ? "text-destructive" : "text-foreground",
                  )}
                >
                  {selectedAsset.temperature}°C
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Vibration Profile</span>
                <span
                  className={cn(
                    "font-bold",
                    selectedAsset.vibration.includes("Limit") ? "text-warning" : "text-foreground",
                  )}
                >
                  {selectedAsset.vibration}
                </span>
              </div>
              {selectedAsset.insulation && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Coil Insulation</span>
                  <span className="text-destructive font-bold">{selectedAsset.insulation}</span>
                </div>
              )}
            </div>

            {/* Recommendation block */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                Recommended Action
              </span>
              <div
                className={cn(
                  "rounded-xl border p-3 text-xs leading-relaxed",
                  selectedAsset.severity === "critical"
                    ? "border-destructive/30 bg-destructive/[0.02] text-destructive-foreground"
                    : selectedAsset.severity === "warning"
                      ? "border-warning/30 bg-warning/[0.02] text-warning-foreground"
                      : "border-border bg-secondary/10 text-muted-foreground",
                )}
              >
                <div className="flex gap-2 items-start">
                  {selectedAsset.severity !== "normal" ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-success" />
                  )}
                  <span>{selectedAsset.action}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  alert(
                    `Dispatched maintenance request for Asset: ${selectedAsset.name}. Notifications sent to engineering staff.`,
                  );
                }}
                className="w-full bg-secondary hover:bg-secondary/80 text-xs font-semibold py-2.5 rounded-xl transition-all"
              >
                Log Maintenance Dispatch
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground min-h-[300px] flex flex-col items-center justify-center">
            <Wrench className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h4 className="text-xs font-semibold">No Asset Inspected</h4>
            <p className="text-[10px] text-muted-foreground/70 max-w-[200px] mt-1 leading-relaxed">
              Select an equipment asset from the forecasting grid to check vibration patterns,
              thermal indices, and dispatcher suggestions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
