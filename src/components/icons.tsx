type IconProps = { className?: string };
const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icon = {
  Home: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9z" />
    </svg>
  ),
  Nfc: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M6 4c3 2 3 14 0 16" />
      <path d="M10 6c2 2 2 10 0 12" />
      <path d="M14 8c1 1.5 1 6.5 0 8" />
      <circle cx="18" cy="12" r="1.4" />
    </svg>
  ),
  Seat: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M5 20v-3h14v3" />
      <path d="M7 17V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8" />
      <path d="M9 17v-4h6v4" />
    </svg>
  ),
  Crowd: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" />
      <circle cx="16" cy="10" r="2" />
      <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <path d="M14 19c0-2 1.5-4 4-4s2 1.5 2 4" />
    </svg>
  ),
  Sos: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M12 3l9 5v4c0 5-4 8-9 9-5-1-9-4-9-9V8l9-5z" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.6" fill="currentColor" />
    </svg>
  ),
  Bell: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  Language: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M4 6h9" />
      <path d="M8 4v2" />
      <path d="M4 10c1 4 4 6 8 6" />
      <path d="M12 10c-1 4-4 6-8 6" />
      <path d="M13 20l4-9 4 9" />
      <path d="M14.5 17h5" />
    </svg>
  ),
  Spark: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
    </svg>
  ),
  Food: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M4 10h16l-1.5 9a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 10z" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  Arrow: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Check: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M5 12l4 4L19 7" />
    </svg>
  ),
  Mic: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  ),
  Live: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M6 6a8 8 0 0 0 0 12M18 6a8 8 0 0 1 0 12" />
    </svg>
  ),
  Trophy: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4z" />
      <path d="M4 5h4v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2V5zM16 5h4v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2V5z" />
      <path d="M10 14h4v3h-4zM8 20h8" />
    </svg>
  ),
  Cog: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2.8-1.6L13 2h-4l-.6 2.8A7 7 0 0 0 5.6 6.4L3.2 5.5l-2 3.4 2 1.5A7 7 0 0 0 3 12c0 .5.1 1.1.2 1.6l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2.8 1.6L9 22h4l.6-2.8a7 7 0 0 0 2.8-1.6l2.4.9 2-3.4-2-1.5c.1-.5.2-1.1.2-1.6z" />
    </svg>
  ),
  Rss: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden="true">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" fill="currentColor" />
    </svg>
  ),
};

export const FEATURES = [
  { id: "home", to: "/", label: "Home", icon: Icon.Home, title: "Arena" },
  {
    id: "match-centre",
    to: "/match-centre",
    label: "Match Centre",
    icon: Icon.Rss,
    title: "Live Match Centre",
  },
  {
    id: "dashboard",
    to: "/dashboard",
    label: "Dashboard",
    icon: Icon.Live,
    title: "Operations Dashboard",
  },
  { id: "nfc", to: "/nfc", label: "Wayfinding", icon: Icon.Nfc, title: "NFC wayfinding" },
  { id: "seating", to: "/seating", label: "Seating", icon: Icon.Seat, title: "Smart seating" },
  { id: "crowd", to: "/crowd", label: "Crowd", icon: Icon.Crowd, title: "Live crowd" },
  { id: "sos", to: "/sos", label: "Help", icon: Icon.Sos, title: "Emergency" },
  { id: "alerts", to: "/alerts", label: "Alerts", icon: Icon.Bell, title: "Live alerts" },
  {
    id: "translate",
    to: "/translate",
    label: "Translate",
    icon: Icon.Language,
    title: "Translate",
  },
  {
    id: "assistant",
    to: "/assistant",
    label: "Assistant",
    icon: Icon.Spark,
    title: "AI assistant",
  },
  { id: "food", to: "/food", label: "Food", icon: Icon.Food, title: "Cashless food" },
  {
    id: "leaderboard",
    to: "/leaderboard",
    label: "Leaderboard",
    icon: Icon.Trophy,
    title: "Predictions leaderboard",
  },
  { id: "admin", to: "/admin", label: "Admin", icon: Icon.Cog, title: "Admin console" },
] as const;
