import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Camera,
  Activity,
  Shield,
  ShieldAlert,
  Zap,
  Droplet,
  Bell,
  Thermometer,
  Volume2,
  CheckCircle2,
  Cpu,
  AlertTriangle,
  Play,
  RotateCcw,
  Expand,
  Eye,
  Lock,
  Unlock,
  Radio,
  Wifi,
  MapPin,
  Calendar,
  Wrench,
  Users,
  Accessibility,
  Car,
  QrCode,
} from "lucide-react";
import { Card, LiveDot, PanelHeader, TransportBadge } from "@/components/AppShell";
import { cn } from "@/lib/utils";

// Custom stadium modular subcomponents
import { FloorPlan } from "@/components/stadium/FloorPlan";
import { VoiceConsole } from "@/components/stadium/VoiceConsole";
import { EventCalendar } from "@/components/stadium/EventCalendar";
import { PredictiveMaintenance } from "@/components/stadium/PredictiveMaintenance";
import { PdfExporter } from "@/components/stadium/PdfExporter";
import { AccessibilityMonitor } from "@/components/stadium/AccessibilityMonitor";
import { ParkingTracker } from "@/components/stadium/ParkingTracker";
import { PassGenerator } from "@/components/stadium/PassGenerator";

// Create the router route for /dashboard
export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Stadium Ops Dashboard · Arena" },
      {
        name: "description",
        content:
          "Real-time critical stadium operations, environmental sensors, and CCTV control center.",
      },
    ],
  }),
  component: OperationsDashboard,
});

// TYPES & SCHEMAS
interface Sensor {
  id: string;
  name: string;
  type: "temp" | "security" | "water" | "sound" | "smoke";
  location: string;
  value: number;
  unit: string;
  threshold: number;
  status: "normal" | "warning" | "critical";
  lastUpdated: string;
}

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "recording";
  fps: number;
  resolution: string;
  occupancy: number;
  threatLevel: "Normal" | "Elevated" | "High";
}

interface Incident {
  id: string;
  type: string;
  location: string;
  severity: "warning" | "critical";
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

// STUB/HISTORIC DATA FOR RESOURCE USAGE (Last 24 Hours)
const generateResourceData = () => {
  const data = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();

    // Simulate high energy usage during match hours (say 18:00 - 21:00)
    let baseEnergy = 1.8; // MW
    if (hour >= 18 && hour <= 21) {
      baseEnergy = 4.2 + Math.random() * 0.6;
    } else if (hour >= 15 && hour < 18) {
      baseEnergy = 2.8 + Math.random() * 0.4;
    } else if (hour >= 21 && hour <= 23) {
      baseEnergy = 3.0 + Math.random() * 0.5;
    } else {
      baseEnergy = 1.2 + Math.random() * 0.3;
    }

    // Simulate high water usage corresponding to arrival, halftime, and departure
    let baseWater = 60; // L/s
    if (hour === 19) {
      // Halftime bathroom/concession rush
      baseWater = 195 + Math.random() * 15;
    } else if (hour === 17 || hour === 18) {
      // Pre-match arrival
      baseWater = 110 + Math.random() * 12;
    } else if (hour === 21) {
      // Post-match
      baseWater = 130 + Math.random() * 10;
    } else {
      baseWater = 30 + Math.random() * 8;
    }

    data.push({
      time: `${String(hour).padStart(2, "0")}:00`,
      energy: parseFloat(baseEnergy.toFixed(2)),
      water: parseFloat(baseWater.toFixed(1)),
    });
  }
  return data;
};

// INITIAL CAMERA FEEDS CONFIG
const INITIAL_CAMERAS: CameraFeed[] = [
  {
    id: "cam-01",
    name: "Gate A Turnstiles",
    location: "North Gates",
    status: "recording",
    fps: 30,
    resolution: "1080p",
    occupancy: 24,
    threatLevel: "Normal",
  },
  {
    id: "cam-02",
    name: "North Concours Section 102",
    location: "Concession Area",
    status: "recording",
    fps: 30,
    resolution: "1080p",
    occupancy: 112,
    threatLevel: "Normal",
  },
  {
    id: "cam-03",
    name: "Pitch East Sideline",
    location: "Stadium Bowl",
    status: "recording",
    fps: 60,
    resolution: "4K UHD",
    occupancy: 22,
    threatLevel: "Normal",
  },
  {
    id: "cam-04",
    name: "Gate B Security Point",
    location: "South Gates",
    status: "recording",
    fps: 30,
    resolution: "1080p",
    occupancy: 12,
    threatLevel: "Normal",
  },
  {
    id: "cam-05",
    name: "VIP Executive Lounge Corridor",
    location: "West Stand L2",
    status: "recording",
    fps: 30,
    resolution: "1080p",
    occupancy: 4,
    threatLevel: "Normal",
  },
  {
    id: "cam-06",
    name: "Press Box Gallery",
    location: "East Stand L3",
    status: "online",
    fps: 30,
    resolution: "1080p",
    occupancy: 45,
    threatLevel: "Normal",
  },
];

// INITIAL SENSORS CONFIG
const INITIAL_SENSORS: Sensor[] = [
  {
    id: "sens-01",
    name: "Main Server Room Temp",
    type: "temp",
    location: "Operations Core",
    value: 21.4,
    unit: "°C",
    threshold: 28.0,
    status: "normal",
    lastUpdated: "Just now",
  },
  {
    id: "sens-02",
    name: "Section 102 Concours Temp",
    type: "temp",
    location: "North Stand",
    value: 24.2,
    unit: "°C",
    threshold: 38.0,
    status: "normal",
    lastUpdated: "Just now",
  },
  {
    id: "sens-03",
    name: "South Stand Structural Fire Sensor",
    type: "smoke",
    location: "South Stand",
    value: 0.02,
    unit: "ppm",
    threshold: 0.8,
    status: "normal",
    lastUpdated: "Just now",
  },
  {
    id: "sens-04",
    name: "Gate B Access Door Security",
    type: "security",
    location: "South Gates",
    value: 1,
    unit: "Lock State",
    threshold: 1,
    status: "normal",
    lastUpdated: "Just now",
  },
  {
    id: "sens-05",
    name: "Press Box Acoustic Sensor",
    type: "sound",
    location: "East Stand",
    value: 82,
    unit: "dB",
    threshold: 115,
    status: "normal",
    lastUpdated: "Just now",
  },
  {
    id: "sens-06",
    name: "Section 214 Toilet Main Water Flow",
    type: "water",
    location: "West Stand",
    value: 2.1,
    unit: "L/s",
    threshold: 8.5,
    status: "normal",
    lastUpdated: "Just now",
  },
];

// MOCK CCTV VIEW CANVAS COMPONENT
function CctvCanvas({
  camera,
  isEnlarged = false,
  aiAnalysis = false,
  isBreached = false,
}: {
  camera: CameraFeed;
  isEnlarged?: boolean;
  aiAnalysis?: boolean;
  isBreached?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let frame = 0;

    // Set dimensions
    const width = isEnlarged ? 640 : 320;
    const height = isEnlarged ? 360 : 180;
    canvas.width = width;
    canvas.height = height;

    // AI Bounding Box Positions (Simulated)
    const boxes = [
      { x: width * 0.2, y: height * 0.4, w: width * 0.1, h: height * 0.35, label: "Person 92%" },
      { x: width * 0.35, y: height * 0.35, w: width * 0.08, h: height * 0.42, label: "Person 95%" },
      { x: width * 0.65, y: height * 0.45, w: width * 0.12, h: height * 0.3, label: "Person 89%" },
    ];

    const render = () => {
      frame++;

      // 1. Draw base styling & static security cameras grid lines
      ctx.fillStyle = "#0c0d12";
      ctx.fillRect(0, 0, width, height);

      // Draw horizontal scanning scanning visual background (slightly tinted)
      ctx.fillStyle = "rgba(22, 28, 45, 0.4)";
      ctx.fillRect(0, 0, width, height);

      // Camera background static lines (interference grid)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Render simulated physical elements on CCTV
      if (camera.id === "cam-03") {
        // Pitch view simulation
        ctx.strokeStyle = "rgba(34, 197, 94, 0.25)"; // green lines for field
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.8);
        ctx.lineTo(width, height * 0.8);
        ctx.stroke();

        // draw green center circle
        ctx.beginPath();
        ctx.arc(width / 2, height * 0.8, isEnlarged ? 80 : 40, Math.PI, 2 * Math.PI);
        ctx.stroke();
      } else {
        // Hallway/door layout lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.1, height);
        ctx.lineTo(width * 0.3, height * 0.2);
        ctx.lineTo(width * 0.7, height * 0.2);
        ctx.lineTo(width * 0.9, height);
        ctx.stroke();
      }

      // 3. Draw simulated moving heat dots/dots representing people
      ctx.fillStyle = isBreached ? "rgba(239, 68, 68, 0.4)" : "rgba(59, 130, 246, 0.3)";
      const dotCount = Math.min(10, camera.occupancy / 5);
      for (let i = 0; i < dotCount; i++) {
        const offset = Math.sin((frame + i * 200) * 0.01) * (width * 0.15);
        const x = width * 0.5 + Math.cos(i * 30) * (width * 0.2) + offset;
        const y = height * 0.6 + Math.sin(i * 12) * (height * 0.15);
        ctx.beginPath();
        ctx.arc(x, y, isEnlarged ? 12 : 6, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 4. AI bounding box overlay
      if (aiAnalysis) {
        ctx.strokeStyle = isBreached ? "rgba(239, 68, 68, 0.8)" : "rgba(34, 197, 94, 0.8)";
        ctx.fillStyle = isBreached ? "rgba(239, 68, 68, 0.8)" : "rgba(34, 197, 94, 0.8)";
        ctx.lineWidth = isEnlarged ? 2 : 1;
        ctx.font = isEnlarged ? "11px Courier" : "8px Courier";

        boxes.forEach((box, index) => {
          // Add random jitter to coordinates
          const jitterX = Math.sin((frame + index * 100) * 0.05) * 2;
          const jitterY = Math.cos((frame + index * 100) * 0.05) * 1;

          ctx.strokeRect(box.x + jitterX, box.y + jitterY, box.w, box.h);
          ctx.fillText(
            isBreached ? "WARNING ACCESS" : box.label,
            box.x + jitterX,
            box.y + jitterY - 4,
          );
        });

        // AI Metadata summary on top
        ctx.fillText(
          `AI DENSITY CLASSIFIER: ${camera.occupancy} HEADS DETECTED`,
          10,
          isEnlarged ? 40 : 25,
        );
      }

      // 5. Camera static scan overlay line (sweeping down)
      const scanY = (frame * 1.5) % height;
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(0, scanY, width, isEnlarged ? 4 : 2);

      // 6. Draw CCTV static noise flicker
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let i = 0; i < 50; i++) {
        const nx = Math.random() * width;
        const ny = Math.random() * height;
        ctx.fillRect(nx, ny, 1, 1);
      }

      // 7. Text indicators (Ocular displays)
      ctx.fillStyle = isBreached ? "#ef4444" : "#ffffff";
      ctx.font = isEnlarged ? "12px monospace" : "9px monospace";

      // Live flashing indicator
      const flash = Math.floor(frame / 30) % 2 === 0;
      if (flash) {
        ctx.fillStyle = isBreached ? "#ef4444" : "#ff3b30";
        ctx.beginPath();
        ctx.arc(isEnlarged ? 20 : 15, isEnlarged ? 20 : 15, isEnlarged ? 4 : 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(
        `${camera.status.toUpperCase()} ${camera.fps}FPS`,
        isEnlarged ? 32 : 24,
        isEnlarged ? 24 : 18,
      );

      // Camera title
      ctx.fillStyle = "#ffffff";
      ctx.fillText(camera.name, 10, height - (isEnlarged ? 24 : 14));

      // ISO Time Stamp
      const timeStr = new Date().toLocaleTimeString();
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(timeStr, width - (isEnlarged ? 90 : 70), height - (isEnlarged ? 24 : 14));

      // Breached Warning
      if (isBreached) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
        ctx.fillRect(0, 0, width, isEnlarged ? 30 : 20);
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${isEnlarged ? "12px" : "9px"} sans-serif`;
        ctx.fillText(
          "!!! ALARM BREACH DETECTED !!!",
          width / 2 - (isEnlarged ? 90 : 65),
          isEnlarged ? 19 : 14,
        );
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [camera, isEnlarged, aiAnalysis, isBreached]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "block h-full w-full rounded-2xl bg-[#0c0d12]",
        isBreached && "border border-destructive animate-pulse",
      )}
    />
  );
}

// MAIN DASHBOARD COMPONENT
function OperationsDashboard() {
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [sensors, setSensors] = useState<Sensor[]>(INITIAL_SENSORS);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [chartData, setChartData] = useState(generateResourceData());

  // Controls State
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "cameras"
    | "sensors"
    | "charts"
    | "floorplan"
    | "calendar"
    | "predictive"
    | "accessibility"
    | "parking"
    | "passes"
  >("overview");
  const [selectedCamera, setSelectedCamera] = useState<string>("cam-01");
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState<boolean>(true);
  const [simulationPaused, setSimulationPaused] = useState<boolean>(false);

  // Stadium Metric States (Simulated and Live-Updating)
  const [attendance, setAttendance] = useState<number>(76412);
  const [energyDraw, setEnergyDraw] = useState<number>(4.12);
  const [waterFlow, setWaterFlow] = useState<number>(142.6);

  // Live Fluctuation Simulator Hook
  useEffect(() => {
    if (simulationPaused) return;

    const interval = setInterval(() => {
      // 1. Attendance slowly grows toward 80,000 capacity
      setAttendance((prev) => {
        if (prev >= 79950) return 79950;
        const add = Math.floor(Math.random() * 8) + 1;
        return prev + add;
      });

      // 2. Energy consumption fluctuates dynamically
      setEnergyDraw((prev) => {
        const delta = (Math.random() - 0.5) * 0.12;
        const next = prev + delta;
        return parseFloat(Math.max(1.5, Math.min(4.9, next)).toFixed(2));
      });

      // 3. Water flow rate fluctuates dynamically
      setWaterFlow((prev) => {
        const delta = (Math.random() - 0.5) * 4.5;
        const next = prev + delta;
        return parseFloat(Math.max(25, Math.min(220, next)).toFixed(1));
      });

      // 4. Fluctuating specific sensor values slightly
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => {
          if (sensor.status !== "normal") return sensor; // Keep alarm sensors stuck during breach
          let val = sensor.value;
          if (sensor.type === "temp") {
            val += (Math.random() - 0.5) * 0.2;
            val = parseFloat(val.toFixed(1));
          } else if (sensor.type === "sound") {
            val += Math.floor((Math.random() - 0.5) * 6);
            val = Math.max(65, Math.min(105, val));
          } else if (sensor.type === "water") {
            val += (Math.random() - 0.5) * 0.3;
            val = parseFloat(Math.max(0.5, val).toFixed(1));
          }
          return {
            ...sensor,
            value: val,
            lastUpdated: "Just now",
          };
        }),
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [simulationPaused]);

  // FIND ACTIVE CAMERA
  const activeCamera = useMemo(() => {
    return cameras.find((c) => c.id === selectedCamera) || cameras[0];
  }, [cameras, selectedCamera]);

  // COUNT ACTIVE INCIDENTS
  const activeIncidentsCount = useMemo(() => {
    return incidents.filter((i) => !i.acknowledged).length;
  }, [incidents]);

  // TRIGGER A STADIUM CRITICAL EVENT (SIMULATOR)
  const triggerIncident = (type: "temp" | "security" | "power" | "water") => {
    const id = `inc-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString();
    let newIncident: Incident;
    let toastId: string | number;

    if (type === "temp") {
      newIncident = {
        id,
        type: "Thermal Breach",
        location: "North Stand Concours (Section 102)",
        severity: "critical",
        description:
          "HVAC cooling loop failure. Local temperatures rose to 41.2°C, breaching safety threshold of 38.0°C.",
        timestamp,
        acknowledged: false,
      };

      // Set sensor to critical
      setSensors((prev) =>
        prev.map((s) =>
          s.id === "sens-02"
            ? { ...s, value: 41.2, status: "critical" as const, lastUpdated: "Just now" }
            : s,
        ),
      );

      // Trigger standard Sonner Toast
      toastId = toast.error("CRITICAL THERMAL BREACH", {
        description: "Section 102 temperature reached 41.2°C (Safety Threshold: 38.0°C)",
        duration: 10000,
        action: {
          label: "Activate HVAC",
          onClick: () => acknowledgeIncident(id, "sens-02", 24.2),
        },
      });
    } else if (type === "security") {
      newIncident = {
        id,
        type: "Security Perimeter Breach",
        location: "South Gates Security Point",
        severity: "critical",
        description:
          "Forced entry detected on emergency exit Gate B. Access control panel compromised.",
        timestamp,
        acknowledged: false,
      };

      // Update camera 4 threat status
      setCameras((prev) =>
        prev.map((c) => (c.id === "cam-04" ? { ...c, threatLevel: "High" as const } : c)),
      );
      // Update sensor 4 status
      setSensors((prev) =>
        prev.map((s) =>
          s.id === "sens-04"
            ? { ...s, value: 0, status: "critical" as const, lastUpdated: "Just now" }
            : s,
        ),
      );

      setSelectedCamera("cam-04"); // Automatically view breached camera feed

      toastId = toast.error("SECURITY BREACH DETECTED", {
        description: "Gate B Access Door breached. Deploying security units.",
        duration: 12000,
        action: {
          label: "Lockdown Gate",
          onClick: () => acknowledgeIncident(id, "sens-04", 1),
        },
      });
    } else if (type === "power") {
      newIncident = {
        id,
        type: "Grid Load Surge",
        location: "Power Substation East",
        severity: "warning",
        description:
          "East floodlight array power demand surged to 4.95 MW, exceeding safety grid load of 4.5 MW.",
        timestamp,
        acknowledged: false,
      };

      setEnergyDraw(4.95);

      toastId = toast.warning("ELECTRICAL SURGE WARNING", {
        description: "East power substation drawing 4.95 MW (Limit: 4.50 MW)",
        duration: 8000,
        action: {
          label: "Load Shedding",
          onClick: () => {
            setEnergyDraw(4.15);
            toast.success("Shedding complete. Substation stabilized.");
            setIncidents((prev) =>
              prev.map((inc) => (inc.id === id ? { ...inc, acknowledged: true } : inc)),
            );
          },
        },
      });
    } else {
      newIncident = {
        id,
        type: "Main Pipe Leak",
        location: "West Stand Level 2 Toilets",
        severity: "warning",
        description:
          "Section 214 high capacity water line detected massive pressure drops and a flow rate surge of 9.2 L/s.",
        timestamp,
        acknowledged: false,
      };

      setSensors((prev) =>
        prev.map((s) =>
          s.id === "sens-06"
            ? { ...s, value: 9.2, status: "warning" as const, lastUpdated: "Just now" }
            : s,
        ),
      );

      toastId = toast.warning("WATER OVERFLOW DETECTED", {
        description: "Section 214 pipeline flow rate surged to 9.2 L/s.",
        duration: 8000,
        action: {
          label: "Shut Off Valve",
          onClick: () => acknowledgeIncident(id, "sens-06", 2.1),
        },
      });
    }

    setIncidents((prev) => [newIncident, ...prev]);
  };

  // ACKNOWLEDGE/RESOLVE AN EVENT
  const acknowledgeIncident = (incidentId: string, sensorId?: string, restoredValue?: number) => {
    // 1. Mark incident as acknowledged
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, acknowledged: true } : inc)),
    );

    // 2. Restore sensor values if applicable
    if (sensorId && restoredValue !== undefined) {
      setSensors((prev) =>
        prev.map((s) =>
          s.id === sensorId ? { ...s, value: restoredValue, status: "normal" as const } : s,
        ),
      );
    }

    // 3. Clear camera security state if gate was breached
    if (sensorId === "sens-04") {
      setCameras((prev) =>
        prev.map((c) => (c.id === "cam-04" ? { ...c, threatLevel: "Normal" as const } : c)),
      );
    }

    toast.success("System Restored", {
      description: "Incident resolved. Target hardware returned to normal operation parameters.",
    });
  };

  const clearAllIncidents = () => {
    setIncidents([]);
    setSensors(INITIAL_SENSORS);
    setCameras(INITIAL_CAMERAS);
    setEnergyDraw(4.12);
    setWaterFlow(142.6);
    toast.success("Operations Log Cleared", {
      description: "All alarm flags have been reset to factory parameters.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PanelHeader
          eyebrow="Stadium Control Room"
          title="Live Operations Dashboard"
          desc="Critical stadium telemetry, environmental monitoring, security sensors, and integrated video feeds."
        />
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <PdfExporter sensors={sensors} incidents={incidents} />
          <div className="flex items-center gap-2">
            <LiveDot label="CONTROL FEED ACTIVE" />
            <TransportBadge transport={simulationPaused ? "connecting" : "ws"} />
          </div>
        </div>
      </div>

      {/* QUICK STATUS METRICS BAR */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="flex flex-col justify-between h-32 border-l-4 border-l-primary relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Real-time Attendance
                </span>
                <h3 className="mt-1 text-2xl font-semibold tabular-nums">
                  {attendance.toLocaleString()}
                </h3>
              </div>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(attendance / 80000) * 100}%` }}
                />
              </div>
              <span className="shrink-0">{((attendance / 80000) * 100).toFixed(1)}%</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="flex flex-col justify-between h-32 border-l-4 border-l-accent relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Power Demand
                </span>
                <h3 className="mt-1 text-2xl font-semibold tabular-nums">{energyDraw} MW</h3>
              </div>
              <div className="rounded-xl bg-accent/10 p-2 text-accent">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Grid Capacity: 5.0 MW</span>
              <span
                className={cn(energyDraw > 4.5 ? "text-warning font-semibold" : "text-success")}
              >
                {energyDraw > 4.5 ? "Heavy Load" : "Stabilized"}
              </span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="flex flex-col justify-between h-32 border-l-4 border-l-blue-500 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Water Consumption
                </span>
                <h3 className="mt-1 text-2xl font-semibold tabular-nums">{waterFlow} L/s</h3>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
                <Droplet className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Dynamic pressure: 3.4 bar</span>
              <span className="text-success">Normal</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card
            className={cn(
              "flex flex-col justify-between h-32 border-l-4 relative overflow-hidden transition-all duration-300",
              activeIncidentsCount > 0
                ? "border-l-destructive bg-destructive/5"
                : "border-l-success",
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Security Core Alerts
                </span>
                <h3
                  className={cn(
                    "mt-1 text-2xl font-semibold tabular-nums",
                    activeIncidentsCount > 0 ? "text-destructive" : "text-success",
                  )}
                >
                  {activeIncidentsCount > 0 ? `${activeIncidentsCount} ALARMS` : "SECURE"}
                </h3>
              </div>
              <div
                className={cn(
                  "rounded-xl p-2",
                  activeIncidentsCount > 0
                    ? "bg-destructive/15 text-destructive"
                    : "bg-success/15 text-success",
                )}
              >
                {activeIncidentsCount > 0 ? (
                  <ShieldAlert className="h-5 w-5 animate-bounce" />
                ) : (
                  <Shield className="h-5 w-5" />
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Emergency Services: Standby</span>
              <span
                className="text-[11px] underline cursor-pointer hover:text-foreground"
                onClick={clearAllIncidents}
              >
                Reset grid
              </span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* VOICE OPERATIONS DECK */}
      <VoiceConsole
        sensors={sensors}
        onSelectCamera={setSelectedCamera}
        onSelectTab={(tab) => setActiveTab(tab)}
        onClearIncidents={clearAllIncidents}
      />

      {/* VIEW TABS */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {[
          { id: "overview", label: "Overview Room", icon: Cpu },
          { id: "floorplan", label: "Spatial Floor Plan", icon: MapPin },
          { id: "cameras", label: "CCTV Control (Live Feeds)", icon: Camera },
          { id: "sensors", label: "IoT Telemetry Grid", icon: Thermometer },
          { id: "charts", label: "Resource Usage Logs", icon: Activity },
          { id: "calendar", label: "Event Demand Scheduler", icon: Calendar },
          { id: "predictive", label: "Predictive Maintenance", icon: Wrench },
          { id: "accessibility", label: "Accessibility Monitor", icon: Accessibility },
          { id: "parking", label: "Parking Tracker", icon: Car },
          { id: "passes", label: "QR Entry Passes", icon: QrCode },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none",
                activeTab === tab.id
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid gap-6 lg:grid-cols-12"
          >
            {/* Left: CCTV & SIMULATOR */}
            <div className="lg:col-span-8 space-y-6">
              {/* MINI-GRID OF CAMERAS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    CCTV Station (Click a feed to zoom)
                  </h2>
                  <button
                    onClick={() => setAiAnalysisEnabled((p) => !p)}
                    className={cn(
                      "pill text-[10px] border",
                      aiAnalysisEnabled
                        ? "bg-success/15 border-success text-success"
                        : "bg-secondary border-border text-muted-foreground",
                    )}
                  >
                    AI Target Tracking: {aiAnalysisEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {cameras.slice(0, 3).map((cam) => {
                    const isBreached = cam.id === "cam-04" && cam.threatLevel === "High";
                    return (
                      <div
                        key={cam.id}
                        onClick={() => {
                          setSelectedCamera(cam.id);
                          setActiveTab("cameras");
                        }}
                        className={cn(
                          "relative aspect-video rounded-2xl overflow-hidden cursor-pointer border border-border/80 group hover:border-primary transition-all",
                          isBreached &&
                            "border-destructive scale-[1.01] shadow-lg shadow-destructive/10",
                        )}
                      >
                        <CctvCanvas
                          camera={cam}
                          aiAnalysis={aiAnalysisEnabled}
                          isBreached={isBreached}
                        />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1">
                          <Eye className="h-3 w-3 text-primary-foreground" />
                          <span>View</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RESOURCE MINI CHART */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Utilities Usage (Last 24 Hours)
                  </h2>
                  <button
                    onClick={() => setActiveTab("charts")}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Full Analytics
                  </button>
                </div>

                <div className="rounded-3xl border border-border bg-surface-elevated p-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorEnergyMini" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10 }}
                        stroke="rgba(255,255,255,0.4)"
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10 }}
                        stroke="rgba(255,255,255,0.4)"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#161c2d",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="energy"
                        name="Power (MW)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorEnergyMini)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SIMULATION CONTROLS PANEL */}
              <Card className="border border-dashed border-border bg-[#161c2d]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Radio className="h-4 w-4 text-accent animate-pulse" />
                      Hardware Fault Simulation Core
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Simulate critical system thresholds to test the live toast-based notification
                      alarms.
                    </p>
                  </div>
                  <button
                    onClick={() => setSimulationPaused((p) => !p)}
                    className={cn(
                      "pill text-xs px-3 py-1 border flex items-center gap-1.5",
                      simulationPaused
                        ? "bg-warning/20 border-warning text-warning-foreground"
                        : "bg-success/15 border-success text-success",
                    )}
                  >
                    <Wifi className="h-3.5 w-3.5" />
                    {simulationPaused ? "SIMULATION PAUSED" : "SIMULATION STREAMING"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <button
                    onClick={() => triggerIncident("temp")}
                    className="flex flex-col items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 p-3 hover:bg-destructive/20 hover:border-destructive/30 transition-all text-center gap-1.5"
                  >
                    <Thermometer className="h-5 w-5 text-destructive" />
                    <span className="text-[11px] font-semibold text-destructive">
                      HVAC Overheat
                    </span>
                  </button>

                  <button
                    onClick={() => triggerIncident("security")}
                    className="flex flex-col items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 p-3 hover:bg-destructive/20 hover:border-destructive/30 transition-all text-center gap-1.5"
                  >
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    <span className="text-[11px] font-semibold text-destructive">
                      Gate B Forced Entry
                    </span>
                  </button>

                  <button
                    onClick={() => triggerIncident("power")}
                    className="flex flex-col items-center justify-center rounded-2xl bg-warning/10 border border-warning/20 p-3 hover:bg-warning/20 hover:border-warning/30 transition-all text-center gap-1.5"
                  >
                    <Zap className="h-5 w-5 text-warning-foreground" />
                    <span className="text-[11px] font-semibold text-warning-foreground">
                      Power Grid Surge
                    </span>
                  </button>

                  <button
                    onClick={() => triggerIncident("water")}
                    className="flex flex-col items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all text-center gap-1.5"
                  >
                    <Droplet className="h-5 w-5 text-blue-500" />
                    <span className="text-[11px] font-semibold text-blue-500">
                      Water Overpressure
                    </span>
                  </button>
                </div>
              </Card>
            </div>

            {/* Right: Active Alarms log & Sensors list */}
            <div className="lg:col-span-4 space-y-6">
              {/* INCIDENTS LOG */}
              <Card className="flex flex-col h-[280px]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-destructive" />
                    Operations Alarm Log
                  </h3>
                  <span className="pill text-[9px] bg-secondary text-muted-foreground">
                    {incidents.length} logged
                  </span>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2">
                  {incidents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                      <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                      <span className="text-xs font-semibold">No active incidents</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        Grid system checks reporting green
                      </span>
                    </div>
                  ) : (
                    incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className={cn(
                          "rounded-xl border p-2.5 text-xs relative",
                          inc.acknowledged
                            ? "border-border bg-secondary/20 opacity-60"
                            : inc.severity === "critical"
                              ? "border-destructive/30 bg-destructive/5"
                              : "border-warning/30 bg-warning/5",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span
                              className={cn(
                                "font-semibold block",
                                inc.acknowledged
                                  ? "text-muted-foreground"
                                  : inc.severity === "critical"
                                    ? "text-destructive"
                                    : "text-warning-foreground",
                              )}
                            >
                              {inc.type}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {inc.location}
                            </span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">{inc.timestamp}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground/90">
                          {inc.description}
                        </p>

                        {!inc.acknowledged && (
                          <button
                            onClick={() =>
                              acknowledgeIncident(
                                inc.id,
                                inc.type === "Thermal Breach"
                                  ? "sens-02"
                                  : inc.type === "Security Perimeter Breach"
                                    ? "sens-04"
                                    : inc.type === "Main Pipe Leak"
                                      ? "sens-06"
                                      : undefined,
                                inc.type === "Thermal Breach"
                                  ? 24.2
                                  : inc.type === "Security Perimeter Breach"
                                    ? 1
                                    : inc.type === "Main Pipe Leak"
                                      ? 2.1
                                      : undefined,
                              )
                            }
                            className="mt-2 w-full rounded-lg bg-secondary py-1 text-[10px] font-semibold hover:bg-secondary/80 focus:outline-none transition-all"
                          >
                            Resolve Alert
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* MINI IoT STATS */}
              <Card className="flex flex-col h-[320px]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4 text-primary" />
                    Active IoT Sensors
                  </h3>
                  <button
                    onClick={() => setActiveTab("sensors")}
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    All Sensors
                  </button>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
                  {sensors.slice(0, 4).map((sensor) => {
                    const isWarning = sensor.status === "warning";
                    const isCritical = sensor.status === "critical";
                    return (
                      <div
                        key={sensor.id}
                        className="flex items-center justify-between rounded-xl bg-secondary/40 p-2.5 text-xs border border-border/40"
                      >
                        <div>
                          <span className="font-medium block">{sensor.name}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {sensor.location}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              "font-semibold font-mono tabular-nums",
                              isCritical
                                ? "text-destructive"
                                : isWarning
                                  ? "text-warning"
                                  : "text-success",
                            )}
                          >
                            {sensor.value} {sensor.unit}
                          </span>
                          <span className="text-[9px] text-muted-foreground block">
                            {sensor.lastUpdated}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* TAB 2: CCTV FEEDS GRID */}
        {activeTab === "cameras" && (
          <motion.div
            key="cameras"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid gap-6 lg:grid-cols-12"
          >
            {/* Left: Interactive Large CCTV viewer */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between bg-[#161c2d]/10 border border-border p-3 rounded-2xl">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-primary animate-pulse" />
                    LIVE CONSOLE: {activeCamera.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Location: {activeCamera.location} · Resolution: {activeCamera.resolution} ·
                    Streams: 100% stable
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiAnalysisEnabled((p) => !p)}
                    className={cn(
                      "pill text-xs px-2.5 py-1 border flex items-center gap-1",
                      aiAnalysisEnabled
                        ? "bg-success/15 border-success text-success"
                        : "bg-secondary border-border text-muted-foreground",
                    )}
                  >
                    AI Analytics: {aiAnalysisEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Large Feed Area */}
              <div className="aspect-video relative rounded-3xl overflow-hidden border border-border/50 bg-[#0c0d12]">
                <CctvCanvas
                  camera={activeCamera}
                  isEnlarged={true}
                  aiAnalysis={aiAnalysisEnabled}
                  isBreached={activeCamera.id === "cam-04" && activeCamera.threatLevel === "High"}
                />
              </div>

              {/* PTZ and Video Adjustment Simulation Console */}
              <Card className="grid gap-4 grid-cols-2 sm:grid-cols-4 bg-secondary/30">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Lens Zoom controls
                  </span>
                  <div className="flex gap-1">
                    <button className="rounded bg-secondary border border-border/80 px-2 py-1 text-xs font-semibold hover:bg-secondary/70 flex-1">
                      1X
                    </button>
                    <button className="rounded bg-secondary border border-border/80 px-2 py-1 text-xs font-semibold hover:bg-secondary/70 flex-1">
                      4X
                    </button>
                    <button className="rounded bg-secondary border border-border/80 px-2 py-1 text-xs font-semibold hover:bg-secondary/70 flex-1">
                      12X
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Camera Pan Tilt
                  </span>
                  <div className="grid grid-cols-3 gap-0.5 max-w-[90px] mx-auto text-center">
                    <div />
                    <button className="bg-secondary hover:bg-secondary/70 border border-border/60 rounded text-[10px] font-bold">
                      ▲
                    </button>
                    <div />
                    <button className="bg-secondary hover:bg-secondary/70 border border-border/60 rounded text-[10px] font-bold">
                      ◀
                    </button>
                    <button className="bg-primary/25 border border-primary/40 rounded text-[9px] font-bold">
                      C
                    </button>
                    <button className="bg-secondary hover:bg-secondary/70 border border-border/60 rounded text-[10px] font-bold">
                      ▶
                    </button>
                    <div />
                    <button className="bg-secondary hover:bg-secondary/70 border border-border/60 rounded text-[10px] font-bold">
                      ▼
                    </button>
                    <div />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Stream Quality
                  </span>
                  <select className="w-full text-xs rounded border border-border/80 bg-background p-1 focus:outline-none">
                    <option>RAW UNCOMPRESSED</option>
                    <option>H.265 HIGH COMPRESSION</option>
                    <option>HEVC RETINAL GRID</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Video Feed Mode
                  </span>
                  <div className="flex gap-1 text-[10px] font-semibold">
                    <button className="bg-primary/10 border border-primary/30 rounded py-1 flex-1 text-primary">
                      RGB COLOR
                    </button>
                    <button className="bg-secondary border border-border/80 rounded py-1 flex-1 text-muted-foreground">
                      FLIR THERMAL
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Camera Picker Side List */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-primary" />
                Select Active Security Camera
              </h2>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {cameras.map((cam) => {
                  const isSelected = cam.id === selectedCamera;
                  const isBreached = cam.id === "cam-04" && cam.threatLevel === "High";
                  return (
                    <div
                      key={cam.id}
                      onClick={() => setSelectedCamera(cam.id)}
                      className={cn(
                        "rounded-2xl border p-3.5 cursor-pointer transition-all flex items-center justify-between relative overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-secondary/20 hover:bg-secondary/40",
                        isBreached && "border-destructive bg-destructive/5 animate-pulse",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-xl p-2",
                            isBreached
                              ? "bg-destructive/15 text-destructive"
                              : isSelected
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-muted-foreground",
                          )}
                        >
                          <Camera className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs block">{cam.name}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {cam.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "pill text-[9px]",
                            isBreached
                              ? "bg-destructive/15 text-destructive font-bold animate-ping"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {isBreached ? "BREACH WARNING" : `${cam.occupancy} heads`}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 block mt-1 font-mono">
                          {cam.resolution}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: IoT TELEMETRY GRID */}
        {activeTab === "sensors" && (
          <motion.div
            key="sensors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-secondary/30 p-3 rounded-2xl">
              <div>
                <h3 className="font-semibold text-sm">Industrial IoT Infrastructure Grid</h3>
                <p className="text-xs text-muted-foreground">
                  Monitor real-time security door latches, stand thermometers, and audio noise
                  sensors.
                </p>
              </div>
              <button
                onClick={() => setSensors(INITIAL_SENSORS)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary flex items-center gap-1 self-start sm:self-center"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Sensors
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sensors.map((sensor) => {
                const isWarning = sensor.status === "warning";
                const isCritical = sensor.status === "critical";

                // Icon picker
                let SensorIcon = Thermometer;
                if (sensor.type === "security") SensorIcon = Shield;
                else if (sensor.type === "water") SensorIcon = Droplet;
                else if (sensor.type === "sound") SensorIcon = Volume2;
                else if (sensor.type === "smoke") SensorIcon = Cpu;

                return (
                  <Card
                    key={sensor.id}
                    className={cn(
                      "flex flex-col justify-between h-40 border relative transition-all duration-300",
                      isCritical
                        ? "border-destructive bg-destructive/[0.02]"
                        : isWarning
                          ? "border-warning bg-warning/[0.02]"
                          : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            "rounded-xl p-2",
                            isCritical
                              ? "bg-destructive/15 text-destructive"
                              : isWarning
                                ? "bg-warning/15 text-warning"
                                : "bg-primary/10 text-primary",
                          )}
                        >
                          <SensorIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs">{sensor.name}</h4>
                          <span className="text-[10px] text-muted-foreground">
                            {sensor.location}
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "pill text-[9px]",
                          isCritical
                            ? "bg-destructive/15 text-destructive font-bold"
                            : isWarning
                              ? "bg-warning/15 text-warning font-bold"
                              : "bg-success/15 text-success",
                        )}
                      >
                        {sensor.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          Real-time Telemetry
                        </span>
                        <span
                          className={cn(
                            "text-xl font-bold font-mono tabular-nums",
                            isCritical
                              ? "text-destructive"
                              : isWarning
                                ? "text-warning"
                                : "text-foreground",
                          )}
                        >
                          {sensor.value} {sensor.unit}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground">
                        <span>
                          Limit: {sensor.threshold} {sensor.unit}
                        </span>
                        <span className="block text-[9px] opacity-75">{sensor.lastUpdated}</span>
                      </div>
                    </div>

                    {/* Quick Action to Override/Fix alert */}
                    {(isWarning || isCritical) && (
                      <button
                        onClick={() => {
                          const restored =
                            sensor.type === "temp"
                              ? 24.2
                              : sensor.type === "security"
                                ? 1
                                : sensor.type === "water"
                                  ? 2.1
                                  : 85;
                          acknowledgeIncident(`manual-${sensor.id}`, sensor.id, restored);
                        }}
                        className="absolute top-2 right-2 rounded bg-destructive text-primary-foreground font-bold text-[8px] px-2 py-0.5 hover:bg-destructive/90"
                      >
                        Override Alert
                      </button>
                    )}
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 4: RESOURCE CHART (RECHARTS) */}
        {activeTab === "charts" && (
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Energy and Water logs */}
            <Card className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-base flex items-center gap-1.5">
                    <Activity className="h-5 w-5 text-primary" />
                    Resource Load Logs (Last 24 Hours)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive logs for water supply networks and regional stadium electrical
                    grid demand.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="h-3 w-3 rounded-sm bg-primary block" /> Power Draw (MW)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="h-3 w-3 rounded-sm bg-cyan-400 block" /> Water Rate (L/s)
                  </span>
                </div>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: "Power Draw (MW)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "rgba(255,255,255,0.6)",
                      }}
                      stroke="rgba(255,255,255,0.4)"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: "Water Flow (L/s)",
                        angle: 90,
                        position: "insideRight",
                        fill: "rgba(255,255,255,0.6)",
                      }}
                      stroke="rgba(255,255,255,0.4)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161c2d",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="energy"
                      name="Energy Grid Demand (MW)"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorEnergy)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="water"
                      name="Water Flow Rate (L/s)"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorWater)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Insight cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <h4 className="font-semibold text-xs flex items-center gap-1.5 mb-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Electrical Load Insights
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Peak power draws correspond to stadium floodlight activation and food concession
                  ovens at halftime. Dynamic load balancing currently active to maintain usage below
                  5.0 MW contract threshold.
                </p>
              </Card>
              <Card>
                <h4 className="font-semibold text-xs flex items-center gap-1.5 mb-2">
                  <Droplet className="h-4 w-4 text-blue-500" />
                  Hydraulics Efficiency Report
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Water flow peaks sharply during pre-match entries and the 15-minute halftime
                  break. Greywater recycling systems currently reporting 94% efficiency, shaving 2.5
                  L/s off municipal utility strain.
                </p>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === "floorplan" && (
          <motion.div
            key="floorplan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <FloorPlan
              sensors={sensors}
              cameras={cameras}
              onSelectCamera={setSelectedCamera}
              onSelectTab={setActiveTab}
            />
          </motion.div>
        )}

        {activeTab === "calendar" && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <EventCalendar />
          </motion.div>
        )}

        {activeTab === "predictive" && (
          <motion.div
            key="predictive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PredictiveMaintenance />
          </motion.div>
        )}

        {activeTab === "accessibility" && (
          <motion.div
            key="accessibility"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AccessibilityMonitor />
          </motion.div>
        )}

        {activeTab === "parking" && (
          <motion.div
            key="parking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ParkingTracker />
          </motion.div>
        )}

        {activeTab === "passes" && (
          <motion.div
            key="passes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PassGenerator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
