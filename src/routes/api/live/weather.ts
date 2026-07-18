import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/live/weather")({
  server: {
    handlers: {
      GET: async () => {
        const t = Date.now() / 1000;
        const tempC = Math.round(24 + Math.sin(t / 300) * 3 + (Math.random() - 0.5));
        const wind = Math.max(4, Math.round(12 + Math.sin(t / 200) * 6 + Math.random() * 3));
        const humidity = Math.round(58 + Math.sin(t / 250) * 10);
        const conditions = ["Clear", "Partly cloudy", "Overcast", "Light showers"][
          Math.floor((t / 60) % 4)
        ];
        return Response.json(
          { at: Date.now(), tempC, wind, humidity, conditions },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
