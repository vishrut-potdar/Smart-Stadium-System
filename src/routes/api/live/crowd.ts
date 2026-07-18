import { createFileRoute } from "@tanstack/react-router";

const SPOTS = [
  { name: "Restroom · West A", base: 1, capBase: 20 },
  { name: "Restroom · East C", base: 8, capBase: 78 },
  { name: "Burger Grill", base: 12, capBase: 84 },
  { name: "Coffee Bar", base: 3, capBase: 42 },
  { name: "Merch Store", base: 6, capBase: 60 },
  { name: "Craft Beer", base: 15, capBase: 92 },
];

export const Route = createFileRoute("/api/live/crowd")({
  server: {
    handlers: {
      GET: async () => {
        const t = Date.now() / 1000;
        const data = SPOTS.map((s, i) => {
          const wobble = Math.sin(t / 6 + i) * 8 + (Math.random() - 0.5) * 4;
          const cap = Math.max(4, Math.min(99, Math.round(s.capBase + wobble)));
          const wait = Math.max(0, Math.round(s.base + wobble / 4));
          return { name: s.name, cap, wait };
        });
        return Response.json(
          { at: Date.now(), spots: data },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
