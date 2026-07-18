import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, Icon, PanelHeader, Row } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import stadiumImg from "@/assets/stadium-seats.jpg";
import { SeatBookingEngine } from "@/components/SeatBookingEngine";

export const Route = createFileRoute("/seating")({
  head: () => ({
    meta: [
      { title: "Smart seating · Arena" },
      { name: "description", content: "Fill the stands, not the aisles." },
    ],
  }),
  component: SeatingPage,
});

function SeatingPage() {
  const [activeTab, setActiveTab] = useState<"ticket" | "book">("ticket");
  const cols = 12;
  const rows = 8;
  const cells = useMemo(
    () =>
      Array.from({ length: rows * cols }, (_, i) => ({
        density: Math.sin(i * 1.7) * 0.5 + 0.5,
        user: i === 5 * cols + 6, // your seat marker
      })),
    [],
  );

  return (
    <>
      <PanelHeader
        eyebrow="Smart Seating"
        title="Fill the stands, not the aisles."
        desc="AI routes fans through the least-crowded staircases and holds bottleneck sections until they clear. Occupied seats show as people, not blocks."
      />

      {/* Segmented Tab Control */}
      <div className="mb-6 flex justify-center">
        <div className="flex rounded-full bg-secondary/80 p-1 border border-border">
          <button
            onClick={() => setActiveTab("ticket")}
            className={cn(
              "rounded-full px-5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2",
              activeTab === "ticket"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            My Current Pass (NFC)
          </button>
          <button
            onClick={() => setActiveTab("book")}
            className={cn(
              "rounded-full px-5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2",
              activeTab === "book"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Book New Seats & Checkout
          </button>
        </div>
      </div>

      {activeTab === "ticket" ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Section 214 · Live occupancy</h2>
                <p className="text-xs text-muted-foreground">Updated 2 seconds ago</p>
              </div>
              <div
                className="flex items-center gap-3 text-[11px] text-muted-foreground"
                aria-hidden="true"
              >
                <Legend color="bg-success" label="Free" />
                <Legend color="bg-accent" label="Occupied" />
                <Legend color="bg-primary" label="Your seat" />
              </div>
            </div>

            {/* Stadium image with seat overlay */}
            <div className="relative overflow-hidden rounded-2xl border border-border">
              <img
                src={stadiumImg}
                alt="Overhead stadium seating layout"
                width={1600}
                height={900}
                loading="lazy"
                className="h-auto w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40"
                aria-hidden
              />
              <div className="absolute inset-0 flex items-end p-3 sm:p-6">
                <div
                  className="grid w-full gap-[3px] rounded-xl bg-black/30 p-2 backdrop-blur-md"
                  style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                  role="img"
                  aria-label="Live seat occupancy grid for Section 214"
                >
                  {cells.map((c, i) => (
                    <SeatCell key={i} density={c.density} user={c.user} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-secondary/60 p-4 text-sm">
              <span className="font-medium">Suggested route:</span>{" "}
              <span className="text-muted-foreground">
                Use Vomitory 214B — 42% quieter than 214A right now.
              </span>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Your seat</h2>
            <div className="mt-4 rounded-2xl bg-primary p-5 text-primary-foreground">
              <div className="text-xs opacity-70">Sec · Row · Seat</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">214 · F · 12</div>
              <div className="mt-4 flex items-center gap-2 text-xs opacity-90">
                <Icon.Check className="h-4 w-4" /> Verified via NFC
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Stand" value="North Upper" />
              <Row label="Entry gate" value="B · Level 2" />
              <Row label="Expected fill" value="Full by 19:45" />
            </div>
          </Card>
        </div>
      ) : (
        <SeatBookingEngine />
      )}
    </>
  );
}

function SeatCell({ density, user }: { density: number; user: boolean }) {
  const occupied = density > 0.35;
  if (user) {
    return (
      <div
        className="relative grid aspect-square place-items-center rounded-sm bg-primary text-primary-foreground shadow-[0_0_0_2px_white]"
        aria-label="Your seat"
      >
        <PersonSvg className="h-2/3 w-2/3" />
      </div>
    );
  }
  if (!occupied) {
    return <div className="aspect-square rounded-sm bg-success/70" aria-hidden />;
  }
  const intense = density > 0.7;
  return (
    <div
      className={cn(
        "grid aspect-square place-items-center rounded-sm text-white/90",
        intense ? "bg-accent" : "bg-accent/75",
      )}
      aria-hidden
    >
      <PersonSvg className="h-2/3 w-2/3" />
    </div>
  );
}

function PersonSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <circle cx="12" cy="7" r="3" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} /> {label}
    </span>
  );
}
