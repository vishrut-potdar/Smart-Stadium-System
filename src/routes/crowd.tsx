import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, LiveDot, PanelHeader, TransportBadge } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { useLiveFeed } from "@/lib/live-feed";

type Spot = { name: string; cap: number; wait: number };
type Payload = { at: number; spots: Spot[] };

export const Route = createFileRoute("/crowd")({
  head: () => ({
    meta: [
      { title: "Live crowd · Arena" },
      { name: "description", content: "See the crowd before you walk into it." },
    ],
  }),
  component: CrowdPage,
});

function CrowdPage() {
  const parse = useMemo(() => (raw: unknown) => raw as Payload, []);
  const { data, transport, updatedAt } = useLiveFeed<Payload>({
    endpoint: "/api/live/crowd",
    wsChannel: "crowd",
    pollMs: 5000,
    parse,
  });

  const spots = data?.spots ?? [];
  const secs = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt) / 1000)) : 0;

  return (
    <>
      <PanelHeader
        eyebrow="Live Crowd Insights"
        title="See the crowd before you walk into it."
        desc="Computer vision counts heads at every service point and streams live wait times to your phone."
      />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LiveDot />
          <TransportBadge transport={transport} />
        </div>
        <span className="text-[11px] text-muted-foreground" aria-live="polite">
          Updated {secs}s ago
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {(spots.length ? spots : Array(6).fill(null)).map((s: Spot | null, i: number) => (
          <Card key={s?.name ?? i} as="article" className="p-5">
            {s ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{s.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{s.wait} min wait</p>
                  </div>
                  <span
                    className={cn(
                      "pill",
                      s.cap < 40 && "bg-success/15 text-success",
                      s.cap >= 40 && s.cap < 75 && "bg-warning/20 text-warning-foreground",
                      s.cap >= 75 && "bg-destructive/15 text-destructive",
                    )}
                  >
                    {s.cap}% full
                  </span>
                </div>
                <div
                  className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuenow={s.cap}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.name} capacity`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      s.cap < 40 && "bg-success",
                      s.cap >= 40 && s.cap < 75 && "bg-warning",
                      s.cap >= 75 && "bg-destructive",
                    )}
                    style={{ width: `${s.cap}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="h-16 animate-pulse rounded-xl bg-secondary/60" />
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
