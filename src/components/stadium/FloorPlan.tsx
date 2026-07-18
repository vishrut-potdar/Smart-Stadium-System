import { useState, ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Thermometer,
  Volume2,
  Droplet,
  Cpu,
  Camera,
  Activity,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Eye,
  Compass,
  ArrowRight,
  Navigation,
  Accessibility,
  LogOut,
  MapPinned,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface FloorPlanProps {
  sensors: Sensor[];
  cameras: CameraFeed[];
  onSelectCamera: (id: string) => void;
  onSelectTab: (
    tab: "overview" | "cameras" | "sensors" | "charts" | "calendar" | "predictive" | "floorplan",
  ) => void;
}

interface ZoneInfo {
  id: string;
  name: string;
  description: string;
  capacity: string;
  points: string;
  center: { x: number; y: number };
}

const STADIUM_ZONES: ZoneInfo[] = [
  {
    id: "north",
    name: "North Stand",
    description: "Gate A Entry. Section 101-105 seating arrays, concession network alpha.",
    capacity: "22,500 seats",
    points: "150,50 350,50 380,100 120,100",
    center: { x: 250, y: 75 },
  },
  {
    id: "south",
    name: "South Stand",
    description: "Gate B Security Point. General admission gates, support infrastructure.",
    capacity: "24,000 seats",
    points: "120,250 380,250 350,300 150,300",
    center: { x: 250, y: 275 },
  },
  {
    id: "east",
    name: "East Stand",
    description: "Press Gallery, commentary box, Section 301-306 VIP terrace.",
    capacity: "16,500 seats",
    points: "380,100 430,120 430,230 380,250",
    center: { x: 405, y: 175 },
  },
  {
    id: "west",
    name: "West Stand",
    description: "Executive Club, suites, player dressing rooms, operations core.",
    capacity: "17,000 seats",
    points: "70,120 120,100 120,250 70,230",
    center: { x: 95, y: 175 },
  },
];

// Mapping sensor IDs to pixel coordinates on the 500x350 SVG Canvas
const SENSOR_COORDINATES: Record<
  string,
  { x: number; y: number; icon: ComponentType<{ className?: string }> }
> = {
  "sens-01": { x: 105, y: 185, icon: Cpu }, // Operations Core
  "sens-02": { x: 250, y: 75, icon: Thermometer }, // North Stand Concours
  "sens-03": { x: 250, y: 285, icon: Cpu }, // South Stand Fire
  "sens-04": { x: 250, y: 310, icon: Shield }, // South Gate B (Access)
  "sens-05": { x: 405, y: 175, icon: Volume2 }, // Press Box Acoustic (East)
  "sens-06": { x: 95, y: 140, icon: Droplet }, // Section 214 Toilet (West)
};

const CAMERA_COORDINATES: Record<string, { x: number; y: number }> = {
  "cam-01": { x: 250, y: 35 }, // Gate A Turnstiles (North Gates)
  "cam-02": { x: 230, y: 85 }, // North Concours 102
  "cam-03": { x: 250, y: 175 }, // Pitch East Sideline
  "cam-04": { x: 230, y: 310 }, // Gate B Security Point (South Gates)
  "cam-05": { x: 110, y: 165 }, // VIP lounge corridor
  "cam-06": { x: 395, y: 160 }, // Press Box Gallery
};

export function FloorPlan({ sensors, cameras, onSelectCamera, onSelectTab }: FloorPlanProps) {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(null);

  // Pathfinder States
  const [navTarget, setNavTarget] = useState<"seat" | "exit">("seat");
  const [targetSeat, setTargetSeat] = useState<string>("104");
  const [startZone, setStartZone] = useState<string>("south");

  // Determine Gate status from active alarms & occupancies
  const getExitState = (gateId: string) => {
    if (gateId === "gate-a") {
      const cam = cameras.find((c) => c.id === "cam-01");
      const hasIssues = sensors.some((s) => s.location.includes("North") && s.status !== "normal");
      if (hasIssues) {
        return { label: "High Density (Congested)", color: "text-warning", isClear: false };
      }
      return {
        label: `Clear (${cam?.occupancy || 42} heads detected)`,
        color: "text-success",
        isClear: true,
      };
    }
    if (gateId === "gate-b") {
      const cam = cameras.find((c) => c.id === "cam-04");
      const isCritical =
        cam?.threatLevel === "High" ||
        sensors.some((s) => s.id === "sens-04" && s.status === "critical");
      if (isCritical) {
        return {
          label: "BLOCKED (Security Lockdown)",
          color: "text-destructive font-bold animate-pulse",
          isClear: false,
        };
      }
      return {
        label: `High Flow (${cam?.occupancy || 150} heads detected)`,
        color: "text-warning",
        isClear: false,
      };
    }
    if (gateId === "vip-west") {
      return { label: "Clear (VIP & Staff Access)", color: "text-primary", isClear: true };
    }
    // East Tunnel
    return { label: "Direct Flow (Clean)", color: "text-success", isClear: true };
  };

  // Get active route metrics
  const getActiveRoute = () => {
    if (navTarget === "seat") {
      if (targetSeat === "104") {
        return {
          title: "Gate A to Section 104",
          badge: "Shortest & Clear Route",
          badgeColor: "bg-success/15 text-success border border-success/30",
          polylinePoints: "250,35 230,85 250,75",
          steps: [
            {
              name: "Gate A Turnstiles",
              desc: "Clear ingress lines, tap NFC wristband",
              icon: MapPin,
            },
            {
              name: "North Concourse 102",
              desc: "Concourse Alpha (Optimal flow - 1.2m spacing)",
              icon: Compass,
            },
            { name: "North Section 104", desc: "Arrive at Row K, Seat 12", icon: CheckCircle2 },
          ],
        };
      } else if (targetSeat === "204") {
        // Gate B is congested/locked down! Dynamic rerouting via East Tunnel
        return {
          title: "Redirected: East Tunnel to South Section 204",
          badge: "AI Rerouted - Avoids Gate B Lockdown",
          badgeColor: "bg-warning/15 text-warning border border-warning/30",
          polylinePoints: "395,160 350,250 250,275",
          steps: [
            {
              name: "East Side Tunnel",
              desc: "Uncongested gate (Recommended bypass entry)",
              icon: Navigation,
            },
            {
              name: "South-East Concourse",
              desc: "Open egress paths (Density: 28% capacity)",
              icon: Compass,
            },
            { name: "South Section 204", desc: "Arrive at Row G, Seat 4", icon: CheckCircle2 },
          ],
        };
      } else if (targetSeat === "302") {
        return {
          title: "East Tunnel to Section 302",
          badge: "Direct Route",
          badgeColor: "bg-success/15 text-success border border-success/30",
          polylinePoints: "395,160 405,175",
          steps: [
            {
              name: "East Entrance Tunnel",
              desc: "General admission Gate C (Clean flow)",
              icon: MapPin,
            },
            { name: "Press Gallery Access", desc: "Stairs to Level 3 Concourse", icon: Compass },
            { name: "East Section 302", desc: "Arrive at VIP Terrace, Seat 8", icon: CheckCircle2 },
          ],
        };
      } else {
        // VIP
        return {
          title: "VIP West Entrance to Suite 12",
          badge: "Secure Executive Route",
          badgeColor: "bg-primary/15 text-primary border border-primary/30",
          polylinePoints: "110,165 95,175",
          steps: [
            { name: "West VIP Gate Lobby", desc: "Biometric and NFC pass screening", icon: MapPin },
            {
              name: "Executive Hallway Alpha",
              desc: "Secure operational lift system",
              icon: Compass,
            },
            { name: "VIP Executive Suite 12", desc: "Arrive at Suite Lounge", icon: CheckCircle2 },
          ],
        };
      }
    } else {
      // Exit Pathfinder
      if (startZone === "north") {
        return {
          title: "Evacuation: North Stand to Gate A Exterior",
          badge: "Primary Egress Pathway",
          badgeColor: "bg-success/15 text-success border border-success/30",
          polylinePoints: "250,75 230,85 250,35",
          steps: [
            {
              name: "Section 101-105 Exit Door",
              desc: "Follow green emergency placards",
              icon: LogOut,
            },
            {
              name: "North Concourse 102",
              desc: "Flowing smoothly to Gate A exterior",
              icon: Compass,
            },
            {
              name: "Gate A Turnstile Portal",
              desc: "Exterior muster point alpha",
              icon: CheckCircle2,
            },
          ],
        };
      } else if (startZone === "south") {
        // Gate B is blocked! Recommend East Tunnel evacuation path
        return {
          title: "Evacuation Bypass: South Stand to East Tunnel Gate",
          badge: "Rerouted - Gate B Blocked",
          badgeColor:
            "bg-destructive/15 text-destructive border border-destructive/30 animate-pulse",
          polylinePoints: "250,275 350,250 395,160",
          steps: [
            {
              name: "Section 201-205 Exit Door",
              desc: "Bypass South Exit doors (Hold in place)",
              icon: LogOut,
            },
            {
              name: "South-East Concourse Egress",
              desc: "Use eastern corridor flow (Safe)",
              icon: Compass,
            },
            {
              name: "East Tunnel Muster Point",
              desc: "Arrive at Exterior assembly area beta",
              icon: CheckCircle2,
            },
          ],
        };
      } else if (startZone === "east") {
        return {
          title: "Evacuation: East Stand to East Tunnel Exterior",
          badge: "Direct Route",
          badgeColor: "bg-success/15 text-success border border-success/30",
          polylinePoints: "405,175 395,160",
          steps: [
            { name: "East Gallery Corridor", desc: "Level 3 direct stairs down", icon: LogOut },
            { name: "East Access Ramp", desc: "Ramp alpha-east clear of vehicles", icon: Compass },
            { name: "East Tunnel Portal", desc: "Exterior muster point gamma", icon: CheckCircle2 },
          ],
        };
      } else {
        // west
        return {
          title: "Evacuation: West Stand to West VIP Portal",
          badge: "Secure Egress Route",
          badgeColor: "bg-primary/15 text-primary border border-primary/30",
          polylinePoints: "95,175 110,165",
          steps: [
            {
              name: "Executive Suite Hallways",
              desc: "Follow crew marshal directives",
              icon: LogOut,
            },
            { name: "West Lobby Escalator", desc: "Level 1 egress ramp", icon: Compass },
            {
              name: "West VIP Gate External",
              desc: "Exterior VIP loading zone clear",
              icon: CheckCircle2,
            },
          ],
        };
      }
    }
  };

  const activeRoute = getActiveRoute();

  // Helper to determine if a zone has any warnings/criticals
  const getZoneStatus = (zoneId: string) => {
    let hasCritical = false;
    let hasWarning = false;

    sensors.forEach((s) => {
      const isZoneSensor =
        (zoneId === "north" && s.location.includes("North")) ||
        (zoneId === "south" && s.location.includes("South")) ||
        (zoneId === "east" && s.location.includes("East")) ||
        (zoneId === "west" && s.location.includes("West")) ||
        (zoneId === "west" && s.location.includes("Operations")); // Server room is west stand-ish

      if (isZoneSensor) {
        if (s.status === "critical") hasCritical = true;
        if (s.status === "warning") hasWarning = true;
      }
    });

    // Check cameras in this zone
    cameras.forEach((c) => {
      const isZoneCam =
        (zoneId === "north" && c.location.includes("North")) ||
        (zoneId === "south" && c.location.includes("South")) ||
        (zoneId === "east" && c.location.includes("East")) ||
        (zoneId === "west" && c.location.includes("West"));

      if (isZoneCam && c.threatLevel === "High") {
        hasCritical = true;
      }
    });

    if (hasCritical) return "critical";
    if (hasWarning) return "warning";
    return "normal";
  };

  const hoveredZoneDetails = STADIUM_ZONES.find((z) => z.id === activeZone);

  return (
    <div id="stadium-floor-plan" className="grid gap-6 lg:grid-cols-12">
      {/* SVG Canvas and Floor Plan Control */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-primary" />
                Live Spatial Telemetry Map
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hover over zones to inspect structural systems or click any glowing sensor
                coordinate.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success" /> Secure
              </span>
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse" /> Warning
              </span>
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-destructive animate-ping" /> Critical
              </span>
            </div>
          </div>

          {/* SVG Frame */}
          <div className="relative aspect-[500/350] w-full rounded-2xl bg-[#0c0d12]/90 border border-border/40 p-4 flex items-center justify-center">
            <svg viewBox="0 0 500 350" className="w-full h-full max-h-[350px] select-none">
              <defs>
                {/* Pathfinder Dash Animation */}
                <style>{`
                  @keyframes pathGlowDash {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                  .animate-path-dash {
                    stroke-dasharray: 6, 4;
                    animation: pathGlowDash 1.2s linear infinite;
                  }
                `}</style>
                {/* Glow Filters */}
                <filter id="glow-warning" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-critical" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* SVG Gradients */}
                <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#153e1e" />
                  <stop offset="100%" stopColor="#0a2211" />
                </linearGradient>
                <linearGradient id="zoneGradNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(22, 28, 45, 0.4)" />
                  <stop offset="100%" stopColor="rgba(11, 13, 21, 0.6)" />
                </linearGradient>
              </defs>

              {/* STADIUM PITCH / FIELD (CENTER) */}
              <g id="stadium-pitch">
                {/* Grass Area */}
                <rect
                  x="150"
                  y="120"
                  width="200"
                  height="110"
                  rx="15"
                  fill="url(#pitchGrad)"
                  stroke="rgba(34, 197, 94, 0.3)"
                  strokeWidth="2"
                />
                {/* Center Circle */}
                <circle
                  cx="250"
                  cy="175"
                  r="25"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                />
                {/* Center Line */}
                <line
                  x1="250"
                  y1="120"
                  x2="250"
                  y2="230"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                />
                {/* Penalty Boxes */}
                <rect
                  x="150"
                  y="150"
                  width="25"
                  height="50"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                />
                <rect
                  x="325"
                  y="150"
                  width="25"
                  height="50"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                />
              </g>

              {/* SEATING ZONES */}
              {STADIUM_ZONES.map((zone) => {
                const status = getZoneStatus(zone.id);
                const isHovered = activeZone === zone.id;

                let fill = "url(#zoneGradNormal)";
                let stroke = "rgba(255,255,255,0.08)";
                let strokeWidth = "1.5";

                if (status === "critical") {
                  fill = isHovered ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.1)";
                  stroke = "#ef4444";
                  strokeWidth = isHovered ? "3" : "2";
                } else if (status === "warning") {
                  fill = isHovered ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.08)";
                  stroke = "#f59e0b";
                  strokeWidth = isHovered ? "2.5" : "1.8";
                } else if (isHovered) {
                  fill = "rgba(59, 130, 246, 0.12)";
                  stroke = "#3b82f6";
                  strokeWidth = "2.5";
                }

                return (
                  <g
                    key={zone.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveZone(zone.id)}
                    onMouseLeave={() => setActiveZone(null)}
                    onClick={() => {
                      // Automatically find a primary sensor/camera in this zone to highlight
                      const zoneSensors = sensors.filter(
                        (s) =>
                          (zone.id === "north" && s.location.includes("North")) ||
                          (zone.id === "south" && s.location.includes("South")) ||
                          (zone.id === "east" && s.location.includes("East")) ||
                          (zone.id === "west" &&
                            (s.location.includes("West") || s.location.includes("Operations"))),
                      );
                      if (zoneSensors.length > 0) {
                        setSelectedSensor(zoneSensors[0]);
                        setSelectedCamera(null);
                      }
                    }}
                  >
                    {/* Zone Outer Shape */}
                    <polygon
                      points={zone.points}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      className="transition-all duration-300"
                    />

                    {/* Zone Label Text */}
                    <text
                      x={zone.center.x}
                      y={zone.center.y}
                      fill="rgba(255,255,255,0.7)"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isHovered ? "bold" : "normal"}
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {zone.name}
                    </text>

                    {/* Glowing pulse rings for warning/critical zones */}
                    {status === "critical" && (
                      <circle
                        cx={zone.center.x}
                        cy={zone.center.y}
                        r="14"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1"
                        className="animate-ping pointer-events-none"
                        style={{ transformOrigin: `${zone.center.x}px ${zone.center.y}px` }}
                      />
                    )}
                  </g>
                );
              })}

              {/* SENSOR NODES */}
              {sensors.map((sensor) => {
                const coords = SENSOR_COORDINATES[sensor.id];
                if (!coords) return null;

                const isWarning = sensor.status === "warning";
                const isCritical = sensor.status === "critical";
                const isSelected = selectedSensor?.id === sensor.id;

                let color = "#10b981"; // Safe Green
                let pulseClass = "";
                let filter = "";

                if (isCritical) {
                  color = "#ef4444";
                  pulseClass = "animate-pulse";
                  filter = "url(#glow-critical)";
                } else if (isWarning) {
                  color = "#f59e0b";
                  pulseClass = "animate-pulse";
                  filter = "url(#glow-warning)";
                } else if (isSelected) {
                  color = "#3b82f6";
                }

                return (
                  <g
                    key={sensor.id}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSensor(sensor);
                      setSelectedCamera(null);
                    }}
                  >
                    {/* Outer pulse effect ring for warnings */}
                    {(isCritical || isWarning) && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={isCritical ? "12" : "9"}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        className="animate-ping opacity-60"
                        style={{
                          transformOrigin: `${coords.x}px ${coords.y}px`,
                          animationDuration: isCritical ? "1s" : "2s",
                        }}
                      />
                    )}

                    {/* Sensor Base Dot */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isSelected ? "7" : "5.5"}
                      fill={color}
                      stroke="#0c0d12"
                      strokeWidth="1.5"
                      filter={filter}
                      className={pulseClass}
                    />

                    {/* Core Selection Marker */}
                    {isSelected && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r="10"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                );
              })}

              {/* CCTV CAMERA FEED LOCATIONS */}
              {cameras.map((cam) => {
                const coords = CAMERA_COORDINATES[cam.id];
                if (!coords) return null;

                const isBreached = cam.id === "cam-04" && cam.threatLevel === "High";
                const isSelected = selectedCamera?.id === cam.id;

                return (
                  <g
                    key={cam.id}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCamera(cam);
                      setSelectedSensor(null);
                    }}
                  >
                    {/* Camera Cone Visualizer (Field of View) */}
                    {isSelected && (
                      <path
                        d={`M ${coords.x} ${coords.y} L ${coords.x - 25} ${coords.y + 40} A 30 30 0 0 0 ${coords.x + 25} ${coords.y + 40} Z`}
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="rgba(59, 130, 246, 0.3)"
                        strokeWidth="1"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Blinking alarm cone for breached cameras */}
                    {isBreached && (
                      <path
                        d={`M ${coords.x} ${coords.y} L ${coords.x - 30} ${coords.y + 50} A 35 35 0 0 0 ${coords.x + 30} ${coords.y + 50} Z`}
                        fill="rgba(239, 68, 68, 0.2)"
                        stroke="rgba(239, 68, 68, 0.5)"
                        strokeWidth="1"
                        className="animate-pulse pointer-events-none"
                      />
                    )}

                    {/* Camera Marker Box */}
                    <rect
                      x={coords.x - 4}
                      y={coords.y - 4}
                      width="8"
                      height="8"
                      rx="1.5"
                      fill={isBreached ? "#ef4444" : isSelected ? "#3b82f6" : "#1e293b"}
                      stroke={
                        isBreached ? "#ef4444" : isSelected ? "#60a5fa" : "rgba(255,255,255,0.4)"
                      }
                      strokeWidth="1"
                      className={cn(isBreached && "animate-bounce")}
                    />
                  </g>
                );
              })}

              {/* PATHFINDER ROAD/ROUTE OVERLAY */}
              {activeRoute?.polylinePoints && (
                <g id="active-path-route" className="pointer-events-none">
                  {/* Thick glowing background path */}
                  <polyline
                    points={activeRoute.polylinePoints}
                    fill="none"
                    stroke={navTarget === "exit" && startZone === "south" ? "#ef4444" : "#3b82f6"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-40 blur-[2px]"
                  />
                  {/* Thin animated path with dash particles */}
                  <polyline
                    points={activeRoute.polylinePoints}
                    fill="none"
                    stroke={navTarget === "exit" && startZone === "south" ? "#fca5a5" : "#60a5fa"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-path-dash"
                  />
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay (Static absolute element) */}
            <AnimatePresence>
              {hoveredZoneDetails && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-4 left-4 bg-[#0c0d12]/95 border border-border px-3.5 py-2.5 rounded-2xl max-w-[200px] shadow-xl pointer-events-none backdrop-blur-md"
                >
                  <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">
                    {hoveredZoneDetails.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                    Capacity: {hoveredZoneDetails.capacity}
                  </span>
                  <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">
                    {hoveredZoneDetails.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Breadcrumb Pathfinder Panel */}
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Compass className="h-4.5 w-4.5 text-primary animate-spin-slow" />
                Smart Seat & Exit Pathfinder
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculates crowd-density optimized shortest pathing for ingress or emergency egress.
              </p>
            </div>
            <div className="flex bg-secondary p-1 rounded-xl shrink-0">
              <button
                onClick={() => setNavTarget("seat")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5",
                  navTarget === "seat"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MapPinned className="h-3.5 w-3.5" />
                Seat Finder
              </button>
              <button
                onClick={() => setNavTarget("exit")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5",
                  navTarget === "exit"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LogOut className="h-3.5 w-3.5 text-destructive" />
                Nearest Exit
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-12">
            {/* Input Options Column */}
            <div className="sm:col-span-4 space-y-3">
              {navTarget === "seat" ? (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Select Your Seat Section
                  </label>
                  <select
                    value={targetSeat}
                    onChange={(e) => setTargetSeat(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="104">Section 104 (North Stand)</option>
                    <option value="204">Section 204 (South Stand)</option>
                    <option value="302">Section 302 (East Stand)</option>
                    <option value="VIP">VIP Suite 12 (West Stand)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Select Your Current Location
                  </label>
                  <select
                    value={startZone}
                    onChange={(e) => setStartZone(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="north">North Stand (Sections 101-105)</option>
                    <option value="south">South Stand (Sections 201-205)</option>
                    <option value="east">East Stand (Press Gallery)</option>
                    <option value="west">West Stand (Executive Suites)</option>
                  </select>
                </div>
              )}

              {/* Live Crowd Intel Card */}
              <div className="rounded-2xl bg-[#0c0d12]/40 border border-border/40 p-3 space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Gate Congestion Index
                </span>
                <div className="space-y-1.5 text-[10px] font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gate A (North):</span>
                    <span className={cn("font-semibold", getExitState("gate-a").color)}>
                      {getExitState("gate-a").label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gate B (South):</span>
                    <span className={cn("font-semibold", getExitState("gate-b").color)}>
                      {getExitState("gate-b").label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">East Tunnel:</span>
                    <span className={cn("font-semibold", getExitState("east-tunnel").color)}>
                      {getExitState("east-tunnel").label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Breadcrumb Steps Output Column */}
            <div className="sm:col-span-8 flex flex-col justify-between">
              <div className="rounded-2xl border border-border/60 bg-[#0c0d12]/40 p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Navigation className="h-3.5 w-3.5 text-primary" />
                      Dynamic Path Breadcrumbs
                    </span>
                    <span className={cn("text-[9px] font-bold pill", activeRoute.badgeColor)}>
                      {activeRoute.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground mt-2 font-mono uppercase tracking-wide">
                    {activeRoute.title}
                  </h4>
                </div>

                {/* Horizontal Breadcrumb Flow */}
                <div className="grid grid-cols-3 gap-2 relative mt-2 pt-2 border-t border-border/20">
                  {activeRoute.steps.map((step, idx) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={idx} className="relative text-center">
                        <div className="flex justify-center mb-1">
                          <div
                            className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center border",
                              idx === 2
                                ? "bg-success/15 border-success text-success"
                                : idx === 0
                                  ? "bg-primary/15 border-primary text-primary"
                                  : "bg-secondary border-border text-foreground",
                            )}
                          >
                            <StepIcon className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-foreground block truncate">
                          {step.name}
                        </span>
                        <p className="text-[8px] text-muted-foreground leading-normal mt-0.5 line-clamp-2 px-1">
                          {step.desc}
                        </p>
                        {idx < 2 && (
                          <div className="absolute top-3.5 -right-2 text-muted-foreground/40 pointer-events-none hidden xs:block">
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Inspector Panel */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        {selectedSensor && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border bg-surface-elevated p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Sensor Node Inspector
                </span>
                <span
                  className={cn(
                    "pill text-[9px] font-bold",
                    selectedSensor.status === "critical"
                      ? "bg-destructive/15 text-destructive animate-pulse"
                      : selectedSensor.status === "warning"
                        ? "bg-warning/15 text-warning"
                        : "bg-success/15 text-success",
                  )}
                >
                  {selectedSensor.status.toUpperCase()}
                </span>
              </div>

              <h4 className="font-semibold text-sm mt-3">{selectedSensor.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedSensor.location}</p>
            </div>

            <div className="border border-border/40 rounded-2xl bg-[#0c0d12]/50 p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Current Value
                </span>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                  {selectedSensor.value} {selectedSensor.unit}
                </div>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                <span>Threshold limit:</span>
                <div className="font-mono mt-0.5 font-bold">
                  {selectedSensor.threshold} {selectedSensor.unit}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                Hardware Health Diagnostics
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-secondary/20 rounded-xl p-2.5">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground block font-bold capitalize">
                    {selectedSensor.type} sensor
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Node ID:</span>
                  <span className="text-foreground block font-bold">{selectedSensor.id}</span>
                </div>
                <div className="col-span-2 border-t border-border/40 mt-1.5 pt-1.5">
                  <span className="text-muted-foreground">Telemetry Health:</span>
                  <span className="text-success block font-bold">98.2% SIGNAL STABILITY</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onSelectTab("sensors")}
                className="flex-1 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold py-2.5 transition-all text-center"
              >
                Configure Node
              </button>
            </div>
          </motion.div>
        )}

        {selectedCamera && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border bg-surface-elevated p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5" /> CCTV Node Inspector
                </span>
                <span
                  className={cn(
                    "pill text-[9px] font-bold",
                    selectedCamera.threatLevel === "High"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-success/15 text-success",
                  )}
                >
                  {selectedCamera.threatLevel.toUpperCase()} THREAT
                </span>
              </div>

              <h4 className="font-semibold text-sm mt-3">{selectedCamera.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedCamera.location}</p>
            </div>

            <div className="aspect-video relative rounded-2xl overflow-hidden border border-border/60 bg-[#0c0d12]/50">
              {/* Embed static preview */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <Camera className="h-8 w-8 text-muted-foreground/60 mb-1" />
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">
                  CAMERA CONSOLE READY
                </span>
                <span className="text-[9px] text-muted-foreground/80 mt-0.5">
                  {selectedCamera.resolution} · {selectedCamera.fps} FPS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-secondary/20 rounded-xl p-2.5">
              <div>
                <span className="text-muted-foreground">Occupancy:</span>
                <span className="text-foreground block font-bold">
                  {selectedCamera.occupancy} heads detected
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Rec Status:</span>
                <span className="text-success block font-bold capitalize">
                  {selectedCamera.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onSelectCamera(selectedCamera.id);
                  onSelectTab("cameras");
                }}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold py-2.5 transition-all text-center flex items-center justify-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                Trigger Live Feed
              </button>
            </div>
          </motion.div>
        )}

        {!selectedSensor && !selectedCamera && (
          <div className="h-full rounded-3xl border border-dashed border-border flex flex-col items-center justify-center p-6 text-center text-muted-foreground min-h-[300px]">
            <MapPin className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h4 className="text-xs font-semibold">No Spatial Marker Selected</h4>
            <p className="text-[10px] text-muted-foreground/70 max-w-[200px] mt-1 leading-relaxed">
              Click any active glowing sensor node or CCTV camera box on the map to trigger detailed
              inspector telemetry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
