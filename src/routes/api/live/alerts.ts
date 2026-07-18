import { createFileRoute } from "@tanstack/react-router";

// FIFA-style notification pool: goals, VAR, kick-off / half-time / full-time,
// weather and safety. Rotates over time so the UI feels live.
const POOL = [
  {
    tone: "destructive",
    tag: "GOAL",
    title: "GOAL! J. Álvarez 62' — ARG 2-1 FRA",
    body: "Argentina retake the lead with a clinical left-foot finish.",
  },
  {
    tone: "warning",
    tag: "VAR",
    title: "VAR check · Possible penalty for France",
    body: "Referee reviewing a challenge in the Argentina box.",
  },
  {
    tone: "accent",
    tag: "Kick-off",
    title: "2nd half kick-off · 46'",
    body: "We're back underway at Arena Grand — Argentina 2-1 France.",
  },
  {
    tone: "primary",
    tag: "Half-time",
    title: "Half-time · ARG 2-1 FRA",
    body: "15-minute break. Grab a snack — pre-order to skip queues.",
  },
  {
    tone: "destructive",
    tag: "GOAL",
    title: "GOAL! K. Mbappé 58' — ARG 2-1 FRA",
    body: "France strike back with a towering header from a corner.",
  },
  {
    tone: "warning",
    tag: "VAR",
    title: "VAR: Goal awarded",
    body: "Onside by inches — the France equaliser stands.",
  },
  {
    tone: "accent",
    tag: "Full-time",
    title: "Full-time approaches · 5 min added",
    body: "The fourth official signals five minutes of stoppage time.",
  },
  {
    tone: "warning",
    tag: "Weather",
    title: "Light showers expected 21:10",
    body: "Roof partially closes over the West Stand.",
  },
  {
    tone: "destructive",
    tag: "Safety",
    title: "Slippery floor · Gate C",
    body: "Cleaning in progress — please use Gate B.",
  },
  {
    tone: "primary",
    tag: "Schedule",
    title: "Group G kicks off 23:30",
    body: "Brazil vs England — stay for the double header.",
  },
];

export const Route = createFileRoute("/api/live/alerts")({
  server: {
    handlers: {
      GET: async () => {
        const bucket = Math.floor(Date.now() / 15000);
        const start = bucket % POOL.length;
        const alerts = Array.from({ length: 5 }, (_, i) => ({
          id: `${bucket}-${i}`,
          ...POOL[(start + i) % POOL.length],
        }));
        return Response.json(
          { at: Date.now(), alerts },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
