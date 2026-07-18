import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Ticket,
  User,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Flame,
  Volume2,
  Lock,
  UserCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PassGenerator() {
  const [attendeeName, setAttendeeName] = useState("Vishrut Potdar");
  const [seatSection, setSeatSection] = useState("104");
  const [seatRow, setSeatRow] = useState("M");
  const [seatNumber, setSeatNumber] = useState("14");
  const [ticketTier, setTicketTier] = useState<"general" | "vip" | "supporter">("vip");
  const [gateEntry, setGateEntry] = useState("Gate A (North)");

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(1420);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic ticket values
  const uniqueTicketId = `SA-PASS-${seatSection}-${seatRow}${seatNumber}-${ticketTier.toUpperCase()}`;

  // Automatically update Gate based on Section
  useEffect(() => {
    if (seatSection === "104") {
      setGateEntry("Gate A (North)");
    } else if (seatSection === "204") {
      setGateEntry("Gate B (South)");
    } else if (seatSection === "302") {
      setGateEntry("Gate C (East)");
    } else {
      setGateEntry("West VIP Ingress");
    }
  }, [seatSection]);

  // Generate QR Code on state change
  useEffect(() => {
    const qrPayload = JSON.stringify({
      id: uniqueTicketId,
      name: attendeeName,
      seat: `${seatSection}-${seatRow}-${seatNumber}`,
      gate: gateEntry,
      tier: ticketTier.toUpperCase(),
    });

    QRCode.toDataURL(
      qrPayload,
      {
        width: 256,
        margin: 2,
        color: {
          dark: ticketTier === "vip" ? "#d97706" : "#0c0d12", // Amber/Gold for VIP QR, Black for standard
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (err) {
          console.error("QR Code Generation Error", err);
          return;
        }
        setQrCodeUrl(url);
      },
    );
  }, [attendeeName, seatSection, seatRow, seatNumber, ticketTier, gateEntry, uniqueTicketId]);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanSuccess(false);

    // Simulate standard scanner beep and verification
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      setVerifiedCount((prev) => prev + 1);

      // Play a soft synthetic scanner beep sound if supported
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Beep. Access Granted.");
        utterance.rate = 1.8;
        utterance.pitch = 1.5;
        window.speechSynthesis.speak(utterance);
      }

      toast.success(`Turnstile Verified: Welcome ${attendeeName}! Gate turnstile opened.`);
    }, 1500);
  };

  return (
    <div id="touchless-pass-center" className="grid gap-6 lg:grid-cols-12">
      {/* LEFT COLUMN: Entry Pass Configurator (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 space-y-4">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
            <Ticket className="h-3.5 w-3.5" /> Pass Registration Hub
          </span>
          <div>
            <h3 className="font-semibold text-sm">Pass Customizer</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Change ticket information to instantly rebuild the dynamic secure entry payload.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                Attendee Full Name
              </label>
              <input
                type="text"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  Ticket Level
                </label>
                <select
                  value={ticketTier}
                  onChange={(e) => setTicketTier(e.target.value as "general" | "vip" | "supporter")}
                  className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="vip">VIP Executive Box</option>
                  <option value="supporter">Supporter Section</option>
                  <option value="general">General Admission</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  Seating Section
                </label>
                <select
                  value={seatSection}
                  onChange={(e) => setSeatSection(e.target.value)}
                  className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="104">Section 104 (North)</option>
                  <option value="204">Section 204 (South)</option>
                  <option value="302">Section 302 (East)</option>
                  <option value="VIP">VIP Suite 12 (West)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  Row Block
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={seatRow}
                  onChange={(e) => setSeatRow(e.target.value.toUpperCase())}
                  className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  Seat Number
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-secondary/20 p-3 flex gap-2 border border-border/40">
              <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <div className="text-[10px] text-muted-foreground leading-normal">
                <span className="font-bold text-foreground block">Verified Ingress Routing</span>
                This ticket has been assigned to{" "}
                <span className="font-semibold text-foreground">{gateEntry}</span>. Proceed to this
                gate on arrival.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Pass Wallet and Scanner Simulation (7 cols) */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center">
        {/* Pass Card container */}
        <div className="w-full max-w-sm relative">
          {/* Main pass graphics card */}
          <div
            className={cn(
              "rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 h-[460px] transition-all duration-500",
              ticketTier === "vip"
                ? "bg-gradient-to-b from-[#1b1510] to-[#0c0d12] border-amber-500/30 shadow-amber-500/5"
                : "bg-gradient-to-b from-[#0e1726] to-[#0c0d12] border-primary/30 shadow-primary/5",
            )}
          >
            {/* Holographic style effects */}
            <div className="absolute top-0 right-0 left-0 h-[100px] bg-radial-gradient from-transparent to-black/30 pointer-events-none" />

            {/* Ticket Header */}
            <div className="flex justify-between items-center border-b border-border/40 pb-4 relative z-10">
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                  Digital Wallet
                </span>
              </div>
              <span
                className={cn(
                  "text-[8px] font-mono font-bold pill border uppercase tracking-wider",
                  ticketTier === "vip"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                    : "bg-primary/10 border-primary/30 text-primary",
                )}
              >
                {ticketTier} Pass
              </span>
            </div>

            {/* Stadium Info Section */}
            <div className="text-center py-2 relative z-10">
              <span className="text-[10px] font-bold text-primary block uppercase tracking-widest font-mono">
                Grand Stadium Arena
              </span>
              <h4 className="text-sm font-bold text-foreground mt-0.5">
                Grand Finals Championship
              </h4>
              <span className="text-[9px] text-muted-foreground flex items-center justify-center gap-1.5 mt-1 font-mono">
                <Calendar className="h-3 w-3" /> Sat, July 18, 2026 · 19:30
              </span>
            </div>

            {/* QR Code Container with nice pass cutouts */}
            <div className="relative flex justify-center py-4 my-2 z-10">
              {/* Left Ticket Cutout */}
              <div className="absolute left-[-30px] top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#0c0d12] border-r border-border/60" />
              {/* Right Ticket Cutout */}
              <div className="absolute right-[-30px] top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#0c0d12] border-l border-border/60" />

              <div className="p-3 bg-white rounded-2xl relative overflow-hidden max-w-[170px] shadow-lg flex items-center justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Secure QR Pass"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="h-36 w-36 bg-secondary animate-pulse" />
                )}

                {/* Secure Scanning Overlay */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex flex-col items-center justify-center text-primary-foreground"
                    >
                      <RefreshCw className="h-8 w-8 animate-spin text-white" />
                      <span className="text-[9px] font-bold font-mono tracking-widest text-white block mt-2">
                        DECRYPTING...
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Seating Parameters Row */}
            <div className="grid grid-cols-4 gap-2 text-center bg-secondary/20 rounded-2xl p-3 border border-border/40 relative z-10">
              <div>
                <span className="text-[8px] text-muted-foreground uppercase font-bold block">
                  GATE
                </span>
                <span className="text-[10px] font-extrabold text-foreground block mt-0.5 truncate">
                  {gateEntry.split(" ")[0]}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-muted-foreground uppercase font-bold block">
                  SECTION
                </span>
                <span className="text-[10px] font-extrabold text-foreground block mt-0.5">
                  {seatSection}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-muted-foreground uppercase font-bold block">
                  ROW
                </span>
                <span className="text-[10px] font-extrabold text-foreground block mt-0.5">
                  {seatRow}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-muted-foreground uppercase font-bold block">
                  SEAT
                </span>
                <span className="text-[10px] font-extrabold text-foreground block mt-0.5">
                  {seatNumber}
                </span>
              </div>
            </div>

            {/* Ticket Footer / Code */}
            <div className="flex justify-between items-center text-[9px] font-mono border-t border-border/40 pt-4 relative z-10">
              <div>
                <span className="text-muted-foreground block">ATTENDEE</span>
                <span className="font-bold text-foreground block truncate max-w-[120px]">
                  {attendeeName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block">SECURE ID</span>
                <span className="font-bold text-foreground block">
                  {uniqueTicketId.substring(0, 15)}...
                </span>
              </div>
            </div>
          </div>

          {/* Simulate Scan Button Below Card */}
          <div className="mt-5 space-y-3">
            <button
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="w-full rounded-2xl bg-secondary hover:bg-secondary/80 border border-border py-3 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="h-4 w-4 text-primary" />
              {isScanning ? "Scanning at Turnstile..." : "Simulate Turnstile Scanner"}
            </button>

            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground px-2">
              <span>Touchless Gates Admitted today:</span>
              <span className="font-bold text-success flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {verifiedCount} verified
              </span>
            </div>
          </div>

          {/* Success Dialog Overlay */}
          <AnimatePresence>
            {scanSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setScanSuccess(false)}
                className="absolute inset-0 bg-success/95 rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center text-white cursor-pointer"
              >
                <div className="h-16 w-16 bg-white/20 rounded-full border border-white/40 flex items-center justify-center mb-4 animate-bounce">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase font-extrabold text-white/80 block">
                  Access Authorized
                </span>
                <h4 className="font-bold text-lg mt-1">Admitted at {gateEntry}</h4>
                <p className="text-xs text-white/90 max-w-[200px] mt-2 leading-relaxed">
                  Turnstile barrier unlatched. Please tap NFC or present wristband to host inside
                  concourse.
                </p>
                <span className="text-[9px] text-white/50 block mt-6">
                  Click card to clear lock screen
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
