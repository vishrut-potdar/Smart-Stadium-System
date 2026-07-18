/* eslint-disable no-empty */
import { createFileRoute } from "@tanstack/react-router";

/**
 * WebSocket endpoint (Cloudflare Workers). Falls back to 426 on plain HTTP
 * so the client hook can switch to polling.
 */
export const Route = createFileRoute("/api/live/socket")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const upgrade = request.headers.get("upgrade");
        if (!upgrade || upgrade.toLowerCase() !== "websocket") {
          return new Response("Expected WebSocket upgrade", { status: 426 });
        }

        const WSP = (globalThis as unknown as { WebSocketPair?: new () => Record<string, unknown> })
          .WebSocketPair;
        if (!WSP) {
          return new Response("WebSocket not supported on this runtime", { status: 501 });
        }

        const url = new URL(request.url);
        const channel = url.searchParams.get("channel") || "all";

        const pair = new WSP() as unknown as Record<"0" | "1", unknown>;
        const client = pair["0"] as unknown as WebSocket;
        const server = pair["1"] as unknown as WebSocket & { accept: () => void };
        server.accept();

        const tick = () => {
          const t = Date.now() / 1000;
          const payload: Record<string, unknown> = { at: Date.now(), channel };
          if (channel === "crowd" || channel === "all") {
            const SPOTS = [
              { name: "Restroom · West A", base: 1, capBase: 20 },
              { name: "Restroom · East C", base: 8, capBase: 78 },
              { name: "Burger Grill", base: 12, capBase: 84 },
              { name: "Coffee Bar", base: 3, capBase: 42 },
              { name: "Merch Store", base: 6, capBase: 60 },
              { name: "Craft Beer", base: 15, capBase: 92 },
            ];
            payload.spots = SPOTS.map((s, i) => {
              const wobble = Math.sin(t / 6 + i) * 8 + (Math.random() - 0.5) * 4;
              const cap = Math.max(4, Math.min(99, Math.round(s.capBase + wobble)));
              const wait = Math.max(0, Math.round(s.base + wobble / 4));
              return { name: s.name, cap, wait };
            });
          }
          if (channel === "weather" || channel === "all") {
            payload.weather = {
              tempC: Math.round(24 + Math.sin(t / 300) * 3),
              wind: Math.max(4, Math.round(12 + Math.sin(t / 200) * 6)),
              humidity: Math.round(58 + Math.sin(t / 250) * 10),
              conditions: ["Clear", "Partly cloudy", "Overcast", "Light showers"][
                Math.floor((t / 60) % 4)
              ],
            };
          }
          if (channel === "alerts" || channel === "all") {
            const bucket = Math.floor(t / 30) % 6;
            const ALL = [
              {
                id: "a1",
                tone: "destructive",
                tag: "GOAL",
                title: "GOAL! J. Álvarez 62' — ARG 2-1 FRA",
                body: "Argentina retake the lead with a clinical left-foot finish.",
              },
              {
                id: "a2",
                tone: "warning",
                tag: "VAR",
                title: "VAR check · Possible penalty for France",
                body: "Referee reviewing a challenge in the Argentina box.",
              },
              {
                id: "a3",
                tone: "accent",
                tag: "Kick-off",
                title: "2nd half kick-off · 46'",
                body: "We're back underway at Arena Grand — Argentina 2-1 France.",
              },
              {
                id: "a4",
                tone: "primary",
                tag: "Half-time",
                title: "Half-time · ARG 2-1 FRA",
                body: "15-minute break. Grab a snack — pre-order to skip queues.",
              },
              {
                id: "a5",
                tone: "warning",
                tag: "Weather",
                title: "Light shower expected 21:10",
                body: "Roof partially closes over West Stand.",
              },
              {
                id: "a6",
                tone: "destructive",
                tag: "Safety",
                title: "Slippery floor · Gate C",
                body: "Cleaning in progress — please use Gate B.",
              },
            ];
            payload.alerts = ALL.slice(0, 4 + (bucket % 2));
          }
          try {
            server.send(JSON.stringify(payload));
          } catch {}
        };

        tick();
        const interval = setInterval(tick, 5000);
        server.addEventListener("close", () => clearInterval(interval));
        server.addEventListener("error", () => clearInterval(interval));

        return new Response(null, { status: 101, webSocket: client } as unknown as ResponseInit);
      },
    },
  },
});
