import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, Icon, LiveDot, PanelHeader, TransportBadge } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { useLiveFeed } from "@/lib/live-feed";
import { useAdmin } from "@/lib/admin-store";
import {
  getNotifPermission,
  requestNotifPermission,
  maybeNotify,
  type NotifPermission,
} from "@/lib/notifications";

type Alert = { id: string; tone: string; tag: string; title: string; body: string };
type WeatherPayload = { tempC: number; wind: number; humidity: number; conditions: string };

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Live alerts · Arena" },
      { name: "description", content: "The stadium, whispering only what matters." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const parseAlerts = useMemo(
    () => (raw: unknown) => ((raw as { alerts?: Alert[] }).alerts ?? []) as Alert[],
    [],
  );
  const alerts = useLiveFeed<Alert[]>({
    endpoint: "/api/live/alerts",
    wsChannel: "alerts",
    pollMs: 15000,
    parse: parseAlerts,
  });

  const parseWeather = useMemo(
    () => (raw: unknown) => (raw as { weather?: WeatherPayload }).weather as WeatherPayload,
    [],
  );
  const weather = useLiveFeed<WeatherPayload>({
    endpoint: "/api/live/weather",
    wsChannel: "weather",
    pollMs: 30000,
    parse: parseWeather,
  });

  // Merge admin broadcast alerts to the top of the feed.
  const { state: adminState } = useAdmin();
  const merged: Alert[] = useMemo(() => {
    const broadcasts: Alert[] = adminState.broadcastAlerts.map((a) => ({
      id: a.id,
      tone: a.tone,
      tag: a.tag,
      title: a.title,
      body: a.body,
    }));
    return [...broadcasts, ...(alerts.data ?? [])];
  }, [adminState.broadcastAlerts, alerts.data]);

  // Native push notifications
  const [perm, setPerm] = useState<NotifPermission>("default");
  useEffect(() => {
    setPerm(getNotifPermission());
  }, []);
  useEffect(() => {
    if (perm !== "granted") return;
    for (const a of merged) maybeNotify(a);
  }, [merged, perm]);

  return (
    <>
      <PanelHeader
        eyebrow="Live Alerts & Weather"
        title="Only what matters, right when it matters."
        desc="Personalized notifications — weather, delays, schedule shifts, safety — filtered so you never miss a beat."
      />

      <Card className="mb-6" as="section" aria-labelledby="push-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="push-heading" className="text-sm font-semibold">
              Native match notifications
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Get an OS-level alert for goals, VAR checks, kick-off, half-time and full-time — even
              when Arena isn't open.
            </p>
          </div>
          {perm === "unsupported" ? (
            <span className="pill bg-secondary text-muted-foreground">Not supported</span>
          ) : perm === "granted" ? (
            <span
              className="pill bg-success/15 text-success"
              data-testid="push-toggle"
              aria-live="polite"
            >
              Notifications on
            </span>
          ) : perm === "denied" ? (
            <span className="pill bg-destructive/15 text-destructive">
              Blocked in browser settings
            </span>
          ) : (
            <button
              data-testid="push-toggle"
              onClick={async () => setPerm(await requestNotifPermission())}
              className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Turn on match alerts
            </button>
          )}
        </div>
      </Card>

      <Card className="mb-6" as="section" aria-labelledby="weather-heading">
        <div className="flex items-center justify-between">
          <h2 id="weather-heading" className="text-sm font-semibold">
            Now over the pitch
          </h2>
          <div className="flex items-center gap-2">
            <LiveDot />
            <TransportBadge transport={weather.transport} />
          </div>
        </div>
        {weather.data ? (
          <div
            className="mt-4 grid gap-4 sm:grid-cols-4"
            aria-live="polite"
            data-testid="weather-widget"
          >
            <Stat k="Conditions" v={weather.data.conditions} />
            <Stat k="Temperature" v={`${weather.data.tempC}°C`} />
            <Stat k="Wind" v={`${weather.data.wind} km/h`} />
            <Stat k="Humidity" v={`${weather.data.humidity}%`} />
          </div>
        ) : (
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-secondary/60" />
        )}
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Live alerts</h2>
        <div className="flex items-center gap-2">
          <LiveDot />
          <TransportBadge transport={alerts.transport} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2" aria-live="polite" data-testid="alerts-list">
        {merged.map((a: Alert) => (
          <Card key={a.id} as="article" className="p-5" data-testid="alert-card">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl",
                  a.tone === "accent" && "bg-accent/15 text-accent",
                  a.tone === "warning" && "bg-warning/20 text-warning-foreground",
                  a.tone === "primary" && "bg-primary/10 text-primary",
                  a.tone === "destructive" && "bg-destructive/15 text-destructive",
                )}
                aria-hidden
              >
                <Icon.Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {a.tag}
                </div>
                <h3 className="mt-1 text-sm font-semibold" data-testid="alert-title">
                  {a.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {k}
      </div>
      <div className="mt-1 font-semibold">{v}</div>
    </div>
  );
}
