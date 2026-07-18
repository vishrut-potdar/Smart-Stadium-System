import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  HelpCircle,
  AlertCircle,
  Wifi,
  Radio,
  Shield,
  ListCollapse,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Native Speech Recognition Interfaces for type-safe browser integration
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

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

interface VoiceConsoleProps {
  sensors: Sensor[];
  onSelectCamera: (id: string) => void;
  onSelectTab: (
    tab: "overview" | "cameras" | "sensors" | "charts" | "calendar" | "predictive" | "floorplan",
  ) => void;
  onClearIncidents?: () => void;
}

const COMMAND_LIST = [
  { phrase: "Go to overview / show overview", action: "Navigate to operations summary" },
  { phrase: "Go to floor plan / show map", action: "Navigate to interactive SVG map" },
  { phrase: "Go to cameras / show CCTV", action: "Navigate to security camera feeds" },
  { phrase: "Go to sensors / show telemetry", action: "Navigate to IoT sensors grid" },
  { phrase: "Go to calendar / show events", action: "Navigate to match planning calendar" },
  { phrase: "Go to maintenance", action: "Navigate to HVAC and lighting failure forecasts" },
  {
    phrase: "View Gate A / show Gate A camera",
    action: "Routing camera feed for Gate A turnstiles",
  },
  {
    phrase: "View Gate B / show Gate B camera",
    action: "Routing camera feed for Gate B security station",
  },
  {
    phrase: "View VIP Lounge / show VIP camera",
    action: "Routing camera feed for VIP lounge corridor",
  },
  {
    phrase: "Check sensors / sensor status",
    action: "Verbal report of current system sensor telemetry",
  },
  { phrase: "Clear logs / reset alerts", action: "Resolve all active alerts on the system" },
];

export function VoiceConsole({
  sensors,
  onSelectCamera,
  onSelectTab,
  onClearIncidents,
}: VoiceConsoleProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [synthFeedback, setSynthFeedback] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [showCommands, setShowCommands] = useState(false);

  // Maintain callback and sensors state references so the recognition engine
  // can run without constant tear-downs and rebuilds on live updates.
  const sensorsRef = useRef(sensors);
  sensorsRef.current = sensors;

  const onSelectCameraRef = useRef(onSelectCamera);
  onSelectCameraRef.current = onSelectCamera;

  const onSelectTabRef = useRef(onSelectTab);
  onSelectTabRef.current = onSelectTab;

  const onClearIncidentsRef = useRef(onClearIncidents);
  onClearIncidentsRef.current = onClearIncidents;

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95; // professional deeper synthesised tone
      window.speechSynthesis.speak(utterance);
      setSynthFeedback(text);
    }
  }, []);

  const processCommand = useCallback(
    (phrase: string) => {
      setLastCommand(phrase);

      // 1. Navigation Commands
      if (phrase.includes("overview") || phrase.includes("summary")) {
        onSelectTabRef.current("overview");
        speak("Navigating to operations overview room.");
        return;
      }

      if (phrase.includes("floor plan") || phrase.includes("map") || phrase.includes("spatial")) {
        onSelectTabRef.current("floorplan");
        speak("Displaying live stadium floor plan mapping.");
        return;
      }

      if (phrase.includes("camera") || phrase.includes("cctv") || phrase.includes("feeds")) {
        onSelectTabRef.current("cameras");
        speak("Opening live camera console feeds.");
        return;
      }

      if (phrase.includes("telemetry") || phrase.includes("sensor")) {
        if (phrase.includes("status") || phrase.includes("check")) {
          // Handled below in sensor status
        } else {
          onSelectTabRef.current("sensors");
          speak("Accessing active industrial sensors grid.");
          return;
        }
      }

      if (phrase.includes("calendar") || phrase.includes("event") || phrase.includes("upcoming")) {
        onSelectTabRef.current("calendar");
        speak("Opening upcoming matches and forecasting calendar.");
        return;
      }

      if (
        phrase.includes("maintenance") ||
        phrase.includes("predictive") ||
        phrase.includes("forecast")
      ) {
        onSelectTabRef.current("predictive");
        speak("Accessing equipment health and failure forecasts.");
        return;
      }

      // 2. Camera Feeds Triggering
      if (phrase.includes("gate a") || phrase.includes("gate alpha")) {
        onSelectCameraRef.current("cam-01");
        onSelectTabRef.current("cameras");
        speak("Routing Gate A camera turnstile feed.");
        return;
      }

      if (phrase.includes("gate b") || phrase.includes("gate beta")) {
        onSelectCameraRef.current("cam-04");
        onSelectTabRef.current("cameras");
        speak("Routing Gate B camera feed. Incident marker loaded.");
        return;
      }

      if (phrase.includes("vip") || phrase.includes("lounge")) {
        onSelectCameraRef.current("cam-05");
        onSelectTabRef.current("cameras");
        speak("Routing VIP lounge lobby corridors.");
        return;
      }

      if (phrase.includes("pitch") || phrase.includes("field") || phrase.includes("sideline")) {
        onSelectCameraRef.current("cam-03");
        onSelectTabRef.current("cameras");
        speak("Routing main field pitch side camera.");
        return;
      }

      // 3. Sensor status check
      if (
        phrase.includes("sensor status") ||
        phrase.includes("check sensors") ||
        phrase.includes("telemetry status")
      ) {
        const activeWarnings = sensorsRef.current.filter((s) => s.status !== "normal");
        if (activeWarnings.length === 0) {
          speak(
            "Stadium sensors are completely normal. Main Server Room is nineteen point two degrees. All grids are secure.",
          );
        } else {
          const warningsList = activeWarnings
            .map((w) => `${w.name} in ${w.location} is reporting ${w.value} ${w.unit}`)
            .join(". ");
          speak(
            `Attention required. There are ${activeWarnings.length} active anomalies. ${warningsList}`,
          );
        }
        return;
      }

      // 4. Reset logs
      if (phrase.includes("clear") || phrase.includes("reset") || phrase.includes("resolve")) {
        if (onClearIncidentsRef.current) {
          onClearIncidentsRef.current();
          speak("Operational alarms have been acknowledged and cleared.");
        } else {
          speak("Request acknowledged. No clear action bound.");
        }
        return;
      }

      speak(
        "Voice command not recognized. Try saying 'Go to floor plan' or 'Check sensor status'.",
      );
    },
    [speak],
  );

  useEffect(() => {
    // Check for native SpeechRecognition support
    const SpeechRecognitionClass =
      (
        window as unknown as {
          SpeechRecognition?: new () => ISpeechRecognition;
          webkitSpeechRecognition?: new () => ISpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          SpeechRecognition?: new () => ISpeechRecognition;
          webkitSpeechRecognition?: new () => ISpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    const rec = new SpeechRecognitionClass();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
      setTranscript("Listening for vocal instructions...");
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const resultIndex = event.resultIndex;
      const speechText = event.results[resultIndex][0].transcript.toLowerCase().trim();
      setTranscript(speechText);
      processCommand(speechText);
    };

    rec.onerror = (e: { error: string }) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [processCommand]);

  const toggleListening = () => {
    if (!isSupported) {
      speak("Speech recognition is not fully supported in this browser mode.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        recognitionRef.current?.abort();
        setTimeout(() => recognitionRef.current?.start(), 200);
      }
    }
  };

  return (
    <div
      id="vocal-command-interface"
      className="rounded-3xl border border-border bg-[#161c2d]/10 p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-1.5 rounded-xl bg-primary/10 text-primary",
              isListening && "animate-pulse",
            )}
          >
            <Radio className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Voice Command Station
            </h3>
            <span className="text-[10px] text-muted-foreground">
              Browser-native vocal operations assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCommands(!showCommands)}
            className="rounded-full border border-border/80 bg-background/50 px-2.5 py-1 text-[10px] font-semibold hover:bg-secondary flex items-center gap-1.5"
          >
            <HelpCircle className="h-3 w-3" />
            {showCommands ? "Hide Reference" : "View Command List"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12 items-center">
        {/* Listen Action */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-secondary/25 border border-border/40 rounded-2xl relative overflow-hidden">
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <span className="h-24 w-24 rounded-full border-4 border-primary animate-ping" />
              <span
                className="h-16 w-16 rounded-full border-2 border-primary animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
            </div>
          )}

          <button
            onClick={toggleListening}
            className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center border-2 transition-all shadow-lg shadow-primary/5 cursor-pointer relative z-10",
              isListening
                ? "bg-destructive border-destructive text-destructive-foreground animate-pulse"
                : "bg-primary border-primary text-primary-foreground hover:scale-105",
            )}
          >
            {isListening ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
          </button>

          <span className="text-[10px] uppercase font-bold text-muted-foreground mt-3 tracking-wider">
            {isListening ? "Listening... Speak Now" : "Microphone Off"}
          </span>
          <span className="text-[9px] text-muted-foreground/80 mt-0.5 text-center">
            {isListening
              ? "Say 'go to floor plan' or 'sensor status'"
              : "Click circle to initiate listen session"}
          </span>
        </div>

        {/* Console logs */}
        <div className="md:col-span-8 space-y-3">
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
              Speech Transcript Stream
            </span>
            <div className="rounded-xl border border-border/40 bg-[#0c0d12]/90 p-3 h-14 overflow-y-auto text-xs font-mono flex items-center">
              {transcript ? (
                <span
                  className={cn(
                    "text-foreground",
                    isListening ? "text-primary animate-pulse" : "text-success",
                  )}
                >
                  &gt; {transcript}
                </span>
              ) : (
                <span className="text-muted-foreground/60">
                  &gt; No voice stream registered. Click mic and speak.
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
            <div className="rounded-xl bg-secondary/35 border border-border/30 p-2.5">
              <span className="text-muted-foreground block">Last parsed command:</span>
              <span className="text-primary block font-bold truncate mt-1">
                {lastCommand ? `"${lastCommand}"` : "None"}
              </span>
            </div>
            <div className="rounded-xl bg-secondary/35 border border-border/30 p-2.5">
              <span className="text-muted-foreground block flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5 text-accent" /> Synthesizer:
              </span>
              <span className="text-accent block font-bold truncate mt-1">
                {synthFeedback ? `"${synthFeedback}"` : "Standby"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Commands Cheat Sheet Drawer */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border/40 pt-4"
          >
            <div className="bg-secondary/20 rounded-2xl border border-border/30 p-4">
              <h4 className="text-xs font-bold flex items-center gap-1.5 mb-2.5 text-foreground">
                <Shield className="h-4 w-4 text-primary" /> Supported Security Voice Commands
                Reference
              </h4>
              <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-1">
                {COMMAND_LIST.map((cmd, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-[10px] font-mono border-b border-border/10 pb-1.5"
                  >
                    <span className="text-success font-bold">&quot;{cmd.phrase}&quot;</span>
                    <span className="text-muted-foreground/90">{cmd.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
