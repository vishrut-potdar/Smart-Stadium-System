import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rss,
  Search,
  RefreshCw,
  Radio,
  Tv,
  Activity,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Clock,
  Newspaper,
  ChevronRight,
  Globe,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Card, PanelHeader, LiveDot } from "@/components/AppShell";

export const Route = createFileRoute("/match-centre")({
  head: () => ({
    meta: [
      { title: "Live Match Centre · Arena" },
      {
        name: "description",
        content:
          "Real-time aggregated live soccer match scores, standings, and sports feeds from BBC & Sky Sports.",
      },
    ],
  }),
  component: MatchCentre,
});

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

interface LiveMatch {
  minute: number;
  half: string;
  teamA: {
    code: string;
    name: string;
    score: number;
    possession: number;
    shots: number;
  };
  teamB: {
    code: string;
    name: string;
    score: number;
    possession: number;
    shots: number;
  };
  onlineStatus: string;
}

// Generate some authentic live commentary ticker entries that rotate / tick dynamically
const LIVE_COMMENTARY_TEMPLATES = [
  {
    text: "STADIUM DIRECTORY: Spectators are advised to use the nearest cashless kiosk for pre-ordered refreshments during the upcoming break.",
    type: "system",
  },
  {
    text: "TACTICAL SHIFT: Argentina's manager instructs Fernandez to play a more defensive role in front of the center backs.",
    type: "tactical",
  },
  {
    text: "CHANCE! Mbappé cuts inside from the left wing, skipping past two defenders, but his final curling shot flies just wide of the post!",
    type: "chance",
  },
  {
    text: "OFFSIDE: Álvarez is flagged offside after running onto a clever lofted pass from De Paul.",
    type: "offside",
  },
  {
    text: "PITCH UPDATE: The hybrid grass surface is playing exceptionally fast today, assisting both team's quick passing cycles.",
    type: "system",
  },
  {
    text: "STADIUM NOISE: The home fans are making an absolute racket in the North Stand, chanting as Argentina controls possession.",
    type: "system",
  },
  {
    text: "CLOSE SHOT: Griezmann delivers an outstanding inswinging corner, but Martinez punches it clear at the near post.",
    type: "chance",
  },
  {
    text: "FOUL: Tchouaméni commits a heavy challenge on Mac Allister in midfield. The referee gives him a final verbal warning.",
    type: "foul",
  },
  {
    text: "COUNTER ATTACK: France launches a high-speed counter led by Dembélé, but Otamendi steps in with an extremely vital tackle.",
    type: "tactical",
  },
];

function MatchCentre() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<"all" | "bbc" | "sky">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlineStatus, setOnlineStatus] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Real-time commentary state
  const [commentary, setCommentary] = useState<
    Array<{ time: string; minute: number; text: string; type: string }>
  >([
    {
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      minute: 67,
      text: "MATCH UPDATES ACTIVE: Aggregated telemetry stream is successfully synchronized with live match coordinators.",
      type: "system",
    },
    {
      time: new Date(Date.now() - 1000 * 65).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      minute: 65,
      text: "VAR REVIEW COMPLETE: Challenge was reviewed by the officials. Play continues - no penalty awarded.",
      type: "var",
    },
  ]);

  // Fetch match details and RSS news feeds
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await fetch(`/api/live/match-info?source=${sourceFilter}`);
        if (!res.ok) throw new Error("API returned non-200");
        const data = await res.json();

        setNews(data.news);
        setMatch(data.liveMatch);
        setOnlineStatus(data.online);
        setLastRefreshed(new Date());

        if (isManual) {
          toast.success("Match Centre Synchronized", {
            description: data.online
              ? "Successfully pulled latest live news from BBC Sport & Sky Sports online RSS."
              : "Successfully refreshed live stadium telemetry feeds.",
            duration: 3000,
          });
        }
      } catch (err) {
        console.error("Error fetching match centre data:", err);
        toast.error("Telemetry Refresh Failed", {
          description: "Reverted to cached local companion server stream.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sourceFilter],
  );

  // Initial load and auto-polling every 12 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 12000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle ticking commentary events every 15 seconds
  useEffect(() => {
    const commInterval = setInterval(() => {
      if (!match) return;
      const t = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const randomTemplate =
        LIVE_COMMENTARY_TEMPLATES[Math.floor(Math.random() * LIVE_COMMENTARY_TEMPLATES.length)];

      // Prevent duplicating consecutive items
      setCommentary((prev) => {
        if (prev[0]?.text === randomTemplate.text) return prev;

        // Notify user about major matches events
        if (randomTemplate.type === "chance") {
          toast("🔥 Major Scoring Opportunity!", {
            description: randomTemplate.text,
            duration: 4000,
          });
        }

        return [
          {
            time: t,
            minute: match.minute,
            text: randomTemplate.text,
            type: randomTemplate.type,
          },
          ...prev.slice(0, 7), // Keep last 8 updates for clean layout
        ];
      });
    }, 15000);

    return () => clearInterval(commInterval);
  }, [match]);

  // Filtered News Items based on keyword query
  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return news;
    const query = searchQuery.toLowerCase();
    return news.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query),
    );
  }, [news, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Upper Status Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PanelHeader
          eyebrow="Online Sports Stream"
          title="Match Centre & Feeds"
          desc="Real-time live companion console aggregating match scoreline dynamics and professional soccer press feeds."
        />
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface-elevated px-4 py-2 text-xs font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${onlineStatus ? "bg-success" : "bg-warning"} opacity-70`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${onlineStatus ? "bg-success" : "bg-warning"}`}
              />
            </span>
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
              {onlineStatus ? "ONLINE AGGREGATOR ACTIVE" : "STADIUM CACHED STREAM"}
            </span>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated hover:bg-secondary px-4 py-2 text-xs font-semibold text-foreground transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            Refresh Feeds
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Synchronizing live tournament streams...
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Dynamic Scorecard & Live Stats (col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            {/* LIVE SCORECARD CARD */}
            {match && (
              <Card className="relative overflow-hidden border-l-4 border-l-primary bg-gradient-to-br from-surface-elevated to-primary/5">
                <div className="flex items-center justify-between">
                  <div className="pill inline-flex bg-primary/10 text-primary">
                    <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                    Live · {match.minute}′
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    World Cup Group Stage
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground font-mono">
                      {match.teamA.code}
                    </div>
                    <div className="text-xl font-bold tracking-tight text-foreground">
                      {match.teamA.name}
                    </div>
                  </div>
                  <div className="text-center shrink-0 px-4">
                    <div className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-4xl">
                      {match.teamA.score}{" "}
                      <span className="text-muted-foreground/30 font-medium">·</span>{" "}
                      {match.teamB.score}
                    </div>
                    <div className="mt-1 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                      {match.half}
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-xs text-muted-foreground font-mono">
                      {match.teamB.code}
                    </div>
                    <div className="text-xl font-bold tracking-tight text-foreground">
                      {match.teamB.name}
                    </div>
                  </div>
                </div>

                {/* Simulated Stat Bars */}
                <div className="mt-6 rounded-2xl bg-secondary/30 p-4 space-y-3 border border-border/40">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    Live Match Dynamics
                  </h4>

                  {/* Possession */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Possession</span>
                      <span className="font-semibold text-foreground">
                        {match.teamA.possession}% – {match.teamB.possession}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden flex">
                      <div
                        className="bg-primary h-full transition-all duration-1000"
                        style={{ width: `${match.teamA.possession}%` }}
                      />
                      <div
                        className="bg-accent h-full transition-all duration-1000"
                        style={{ width: `${match.teamB.possession}%` }}
                      />
                    </div>
                  </div>

                  {/* Shots */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Total Shots</span>
                      <span className="font-semibold text-foreground">
                        {match.teamA.shots} – {match.teamB.shots}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden flex">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{
                          width: `${(match.teamA.shots / (match.teamA.shots + match.teamB.shots || 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-accent h-full transition-all duration-500"
                        style={{
                          width: `${(match.teamB.shots / (match.teamA.shots + match.teamB.shots || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* LIVE COMMENTARY TICKER */}
            <Card className="flex flex-col h-[400px]">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary animate-pulse" />
                  Stadium Ticker Commentary
                </h3>
                <span className="pill bg-primary/10 text-primary text-[10px] font-semibold">
                  Auto-Updating
                </span>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                <AnimatePresence initial={false}>
                  {commentary.map((comm, idx) => (
                    <motion.div
                      key={`${comm.minute}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs flex items-start gap-2.5 hover:bg-secondary/40 transition-colors"
                    >
                      <span className="font-mono text-primary font-bold shrink-0">
                        {comm.minute}′
                      </span>
                      <div className="space-y-1">
                        <p className="text-foreground leading-relaxed">{comm.text}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {comm.time}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                              comm.type === "chance"
                                ? "bg-success/10 text-success"
                                : comm.type === "var"
                                  ? "bg-warning/10 text-warning"
                                  : comm.type === "foul"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {comm.type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Aggregated Online News Feeds (col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* SEARCH AND SOURCE SWITCHER BAR */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter news by player, team or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-surface-elevated pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              {/* Source filter tabs */}
              <div className="flex rounded-full bg-secondary/60 p-1 border border-border/50 self-start shrink-0">
                <button
                  onClick={() => setSourceFilter("all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    sourceFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Feeds
                </button>
                <button
                  onClick={() => setSourceFilter("bbc")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    sourceFilter === "bbc"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  BBC Sport
                </button>
                <button
                  onClick={() => setSourceFilter("sky")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    sourceFilter === "sky"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sky Sports
                </button>
              </div>
            </div>

            {/* LIVE NEWS LISTING */}
            <div className="space-y-3 h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {filteredNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-surface-elevated rounded-3xl border border-dashed border-border/80 h-full">
                  <Newspaper className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold">No matches found</p>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    Try checking your spelling, removing search filters, or switching feed channels.
                  </p>
                </div>
              ) : (
                filteredNews.map((item, idx) => (
                  <motion.div
                    key={`${item.title}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.4) }}
                    className="group rounded-3xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-glass)] hover:border-primary/50 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Visual source indicator on left edge */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        item.source === "BBC Sport"
                          ? "bg-red-500"
                          : item.source === "Sky Sports"
                            ? "bg-sky-500"
                            : "bg-primary"
                      }`}
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              item.source === "BBC Sport"
                                ? "bg-red-500/10 text-red-500"
                                : item.source === "Sky Sports"
                                  ? "bg-sky-500/10 text-sky-500"
                                  : "bg-primary/10 text-primary"
                            }`}
                          >
                            {item.source}
                          </span>

                          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.pubDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer referrer"
                        className="p-2 rounded-full border border-border bg-secondary/40 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all shrink-0 self-center"
                        aria-label="Read full article online"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Last Refreshed Relative Counter */}
            <div className="text-right text-[10px] text-muted-foreground/60 italic px-2">
              Aggregated stream synchronized: {lastRefreshed.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
