import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Bell,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./AppShell";
import { toast } from "sonner";

type StadiumEvent = {
  id: string;
  title: string;
  type: "match" | "concert" | "athletics" | "festival";
  date: string; // ISO format "2026-07-XX"
  dayNum: number;
  time: string;
  gatesOpen: string;
  expectedAttendance: string;
  desc: string;
  ticketStatus: "Sold Out" | "Available" | "Low Tickets";
  ticketPrice?: string;
};

const STADIUM_EVENTS: StadiumEvent[] = [
  {
    id: "evt-16",
    title: "Argentina vs France · FIFA World Cup",
    type: "match",
    date: "2026-07-16",
    dayNum: 16,
    time: "20:00",
    gatesOpen: "17:30",
    expectedAttendance: "84,500 fans (100% cap)",
    desc: "FIFA World Cup Group F blockbuster double header. Lionel Messi and Kylian Mbappé face off in a historic rematch.",
    ticketStatus: "Sold Out",
  },
  {
    id: "evt-17",
    title: "Coldplay: Music of the Spheres World Tour",
    type: "concert",
    date: "2026-07-17",
    dayNum: 17,
    time: "19:30",
    gatesOpen: "17:00",
    expectedAttendance: "80,000 fans",
    desc: "A mesmerizing audio-visual concert experience featuring kinetic floors, solar-powered lasers, and wearable LED wristbands.",
    ticketStatus: "Low Tickets",
    ticketPrice: "$145.00",
  },
  {
    id: "evt-19",
    title: "Brazil vs England · FIFA World Cup",
    type: "match",
    date: "2026-07-19",
    dayNum: 19,
    time: "18:00",
    gatesOpen: "15:30",
    expectedAttendance: "84,500 fans (100% cap)",
    desc: "FIFA World Cup Group G highly anticipated clash. Experience South American flair meeting English physical intensity.",
    ticketStatus: "Sold Out",
  },
  {
    id: "evt-20",
    title: "Coldplay: Music of the Spheres (Night 2)",
    type: "concert",
    date: "2026-07-20",
    dayNum: 20,
    time: "19:30",
    gatesOpen: "17:00",
    expectedAttendance: "80,000 fans",
    desc: "By popular demand, the legendary band returns for a second night under the retractable Arena roof.",
    ticketStatus: "Available",
    ticketPrice: "$130.00",
  },
  {
    id: "evt-22",
    title: "Spain vs Germany · FIFA World Cup",
    type: "match",
    date: "2026-07-22",
    dayNum: 22,
    time: "21:00",
    gatesOpen: "18:30",
    expectedAttendance: "84,500 fans (100% cap)",
    desc: "Group F tactical masterclass. Direct possession style Spain versus the lightning-fast transition squad of Germany.",
    ticketStatus: "Sold Out",
  },
  {
    id: "evt-24",
    title: "The Weeknd: After Hours Til Dawn Tour",
    type: "concert",
    date: "2026-07-24",
    dayNum: 24,
    time: "20:00",
    gatesOpen: "17:30",
    expectedAttendance: "75,000 fans",
    desc: "Abel Tesfaye brings his immersive sci-fi stage set, massive silver sphere, and synth-pop anthem library.",
    ticketStatus: "Low Tickets",
    ticketPrice: "$160.00",
  },
  {
    id: "evt-26",
    title: "USA vs Mexico · Concacaf Derby",
    type: "match",
    date: "2026-07-26",
    dayNum: 26,
    time: "19:00",
    gatesOpen: "16:30",
    expectedAttendance: "84,500 fans (100% cap)",
    desc: "The ultimate North American rivalry match. Friendly summer friendly before continental qualifiers begin.",
    ticketStatus: "Low Tickets",
    ticketPrice: "$95.00",
  },
  {
    id: "evt-28",
    title: "World Athletics Diamond League Meet",
    type: "athletics",
    date: "2026-07-28",
    dayNum: 28,
    time: "16:00",
    gatesOpen: "14:00",
    expectedAttendance: "55,000 fans",
    desc: "Olympic champions gather for the premier track & field grand prix event. Sprints, hurdles, and long jump spotlights.",
    ticketStatus: "Available",
    ticketPrice: "$45.00",
  },
  {
    id: "evt-30",
    title: "FIFA World Cup Grand Final 2026",
    type: "match",
    date: "2026-07-30",
    dayNum: 30,
    time: "19:00",
    gatesOpen: "15:00",
    expectedAttendance: "84,500 fans (100% cap)",
    desc: "The ultimate peak of world football. The coronation of the new FIFA World Champions at Arena Grand.",
    ticketStatus: "Sold Out",
  },
];

// July 2026 Calendar days grid
const CALENDAR_START_OFFSET = 3; // July 1, 2026 starts on Wednesday (3rd column)
const TOTAL_DAYS = 31;

export function StadiumCalendar() {
  const [currentDate, setCurrentDate] = useState<string>("2026-07-16");
  const selectedEvent = STADIUM_EVENTS.find((e) => e.date === currentDate);
  const [reminders, setReminders] = useState<string[]>([]);

  const toggleReminder = (id: string, title: string) => {
    if (reminders.includes(id)) {
      setReminders((prev) => prev.filter((r) => r !== id));
      toast.success(`Reminder removed for ${title}`);
    } else {
      setReminders((prev) => [...prev, id]);
      toast.success(
        `Push notification reminder set for ${title}! We will alert you 2 hours before kick-off.`,
      );
    }
  };

  const getEventForDay = (day: number) => {
    const padded = String(day).padStart(2, "0");
    const dateStr = `2026-07-${padded}`;
    return STADIUM_EVENTS.find((e) => e.date === dateStr);
  };

  return (
    <Card className="mt-6" as="section" aria-label="Stadium Event Calendar">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold">Stadium Event Calendar</h3>
          <p className="text-xs text-muted-foreground">
            Browse matches, concerts, and key events scheduled at Arena Grand during July 2026.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarIcon className="h-4.5 w-4.5 text-muted-foreground" />
          <span className="font-semibold text-foreground">July 2026</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        {/* Month Day Grid Panel */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Arena Schedule
            </span>
            <span className="text-xs text-muted-foreground">Select a date with 🟢 or 🔵 dot</span>
          </div>

          {/* Days of the week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-muted-foreground mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Pad offset days of previous month */}
            {Array.from({ length: CALENDAR_START_OFFSET }).map((_, i) => (
              <div key={`offset-${i}`} className="aspect-square bg-transparent opacity-0" />
            ))}

            {/* July Days */}
            {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
              const day = i + 1;
              const padded = String(day).padStart(2, "0");
              const dateStr = `2026-07-${padded}`;
              const dayEvent = getEventForDay(day);
              const isSelected = currentDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setCurrentDate(dateStr)}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold select-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-surface-elevated text-foreground hover:bg-secondary",
                    !dayEvent && "opacity-60 font-medium",
                  )}
                >
                  <span className="tabular-nums">{day}</span>
                  {dayEvent && (
                    <span
                      className={cn(
                        "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                        isSelected
                          ? "bg-white"
                          : dayEvent.type === "match"
                            ? "bg-success"
                            : "bg-accent",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 justify-center text-[10px] text-muted-foreground border-t border-border/60 pt-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" /> FIFA Matches
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" /> Live Concerts / Track Meets
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-secondary border border-border" /> Empty
              Stadium Days
            </span>
          </div>
        </div>

        {/* Selected Event details panel */}
        <div className="flex flex-col justify-between">
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={cn(
                      "pill uppercase font-bold text-[9px] tracking-widest",
                      selectedEvent.type === "match" && "bg-success/15 text-success",
                      selectedEvent.type === "concert" && "bg-accent/15 text-accent",
                      selectedEvent.type === "athletics" && "bg-primary/10 text-primary",
                    )}
                  >
                    {selectedEvent.type}
                  </span>
                  <h4 className="mt-1.5 text-base font-bold tracking-tight">
                    {selectedEvent.title}
                  </h4>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold pill",
                    selectedEvent.ticketStatus === "Sold Out" &&
                      "bg-destructive/15 text-destructive",
                    selectedEvent.ticketStatus === "Low Tickets" &&
                      "bg-warning/20 text-warning-foreground",
                    selectedEvent.ticketStatus === "Available" && "bg-success/15 text-success",
                  )}
                >
                  {selectedEvent.ticketStatus}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">{selectedEvent.desc}</p>

              <div className="space-y-2 border-t border-border pt-4 text-xs">
                <div className="flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Match / Event Start
                  </span>
                  <span className="font-semibold tabular-nums">{selectedEvent.time}</span>
                </div>
                <div className="flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Entry Gates Open
                  </span>
                  <span className="font-semibold tabular-nums">{selectedEvent.gatesOpen}</span>
                </div>
                <div className="flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" /> Expected Attendance
                  </span>
                  <span className="font-semibold">{selectedEvent.expectedAttendance}</span>
                </div>
                <div className="flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> Venue
                  </span>
                  <span className="font-semibold">Arena Grand Stadium</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 pt-2">
                <button
                  onClick={() => toggleReminder(selectedEvent.id, selectedEvent.title)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                    reminders.includes(selectedEvent.id)
                      ? "bg-success/10 border-success/30 text-success"
                      : "border-border bg-surface-elevated text-foreground hover:bg-secondary",
                  )}
                >
                  <Bell className="h-4 w-4" />
                  <span>
                    {reminders.includes(selectedEvent.id) ? "Reminder Active" : "Set Reminder"}
                  </span>
                </button>
                {selectedEvent.ticketStatus !== "Sold Out" ? (
                  <button
                    onClick={() =>
                      toast.success(
                        `Redirecting to Arena ticket checkout for $${selectedEvent.ticketPrice || "90.00"}...`,
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all"
                  >
                    <Ticket className="h-4 w-4" />
                    <span>Buy Tickets ({selectedEvent.ticketPrice || "Book"})</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground cursor-not-allowed"
                  >
                    <Ticket className="h-4 w-4" />
                    <span>Sold Out</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
              <CalendarIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h4 className="text-sm font-semibold">No Major Stadium Event Scheduled</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
                Arena Grand is resting on this date. Stadium tours and fan shop concourses are open
                from 10:00 to 16:00.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
