// FIFA World Cup themed match & tournament data.

export const MATCH = {
  competition: "FIFA World Cup · Group F · Matchday 3",
  venue: "Arena Grand Stadium · Mumbai",
  minute: 67,
  half: "2nd Half",
  teamA: { code: "ARG", name: "Argentina", score: 2, shots: 14, possession: 58, corners: 6 },
  teamB: { code: "FRA", name: "France", score: 1, shots: 9, possession: 42, corners: 3 },
  status: "Argentina lead — 23 minutes left to hold on",
  scorers: [
    { team: "ARG", player: "L. Messi", minute: 34, type: "Penalty" },
    { team: "FRA", player: "K. Mbappé", minute: 58, type: "Header" },
    { team: "ARG", player: "J. Álvarez", minute: 62, type: "Left foot" },
  ],
  next: { home: "BRA", away: "ENG", kickoff: "Tonight · 23:30" },
};

export const TOP_PERFORMER = {
  name: "Lionel Messi",
  role: "Forward · Argentina · #10",
  stat: "1 G · 2 A",
  rating: 9.1,
  formArrow: "up" as const,
  quote: "Directly involved in all three Argentina goals this match.",
};

export const MATCH_ANALYSIS = {
  winProbA: 71,
  drawProb: 18,
  winProbB: 11,
  xgA: 2.14,
  xgB: 0.92,
  keyMoment: "Messi's 34' penalty shifted xG momentum decisively toward Argentina.",
  momentum: "ARG",
};

export const HEAD_TO_HEAD = {
  played: 12,
  aWins: 6,
  bWins: 3,
  draws: 3,
  last5: ["A", "B", "A", "D", "A"] as ("A" | "B" | "D")[],
};

// FIFA-style Group F standings
export const POINTS_TABLE = [
  { team: "Argentina", p: 3, w: 2, d: 1, l: 0, gf: 6, ga: 2, pts: 7 },
  { team: "France", p: 3, w: 1, d: 1, l: 1, gf: 4, ga: 3, pts: 4 },
  { team: "Croatia", p: 3, w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4 },
  { team: "Morocco", p: 3, w: 0, d: 1, l: 2, gf: 1, ga: 6, pts: 1 },
];

export const FIXTURES = [
  {
    day: "Today",
    time: "19:30",
    home: "ARG",
    away: "FRA",
    stage: "Group F",
    venue: "Arena Grand",
    live: true,
  },
  {
    day: "Today",
    time: "23:30",
    home: "BRA",
    away: "ENG",
    stage: "Group G",
    venue: "Estadio Central",
  },
  {
    day: "Tomorrow",
    time: "20:00",
    home: "GER",
    away: "ESP",
    stage: "Group D",
    venue: "Northfield Park",
  },
  {
    day: "Tomorrow",
    time: "23:00",
    home: "POR",
    away: "NED",
    stage: "Group H",
    venue: "Harbour Arena",
  },
];

export const STADIUM = {
  name: "Arena Grand Stadium",
  city: "Mumbai, India",
  capacity: 68_000,
  built: 2011,
  pitch: "Hybrid grass · 105 × 68 m FIFA standard",
  ends: "North Stand · South Stand",
  gatesOpen: "17:00",
  matchStart: "19:30",
};

// Live match timeline (goals, cards, subs, key moments)
export type TimelineEventType =
  "goal" | "yellow" | "red" | "sub" | "var" | "key" | "kickoff" | "half" | "full";
export type TimelineEvent = {
  minute: number;
  team?: "ARG" | "FRA";
  type: TimelineEventType;
  title: string;
  detail?: string;
};
export const TIMELINE: TimelineEvent[] = [
  { minute: 0, type: "kickoff", title: "Kick-off — 1st half" },
  {
    minute: 12,
    team: "FRA",
    type: "yellow",
    title: "Yellow · A. Tchouaméni",
    detail: "Tactical foul at midfield",
  },
  {
    minute: 27,
    team: "ARG",
    type: "key",
    title: "Big chance · Di María",
    detail: "Shot clips the outside of the post",
  },
  {
    minute: 34,
    team: "ARG",
    type: "goal",
    title: "GOAL · L. Messi (pen) 1-0",
    detail: "Cool finish, low to the keeper's left",
  },
  { minute: 45, type: "half", title: "Half-time · ARG 1-0 FRA" },
  { minute: 46, type: "kickoff", title: "Second half underway" },
  {
    minute: 58,
    team: "FRA",
    type: "goal",
    title: "GOAL · K. Mbappé (header) 1-1",
    detail: "Towering header from Griezmann corner",
  },
  { minute: 60, team: "FRA", type: "sub", title: "Sub · Kolo Muani ⟶ Giroud" },
  {
    minute: 62,
    team: "ARG",
    type: "goal",
    title: "GOAL · J. Álvarez 2-1",
    detail: "First-time left-foot finish",
  },
  {
    minute: 66,
    type: "var",
    title: "VAR check · Possible penalty (FRA)",
    detail: "On-field decision stands, no penalty",
  },
  { minute: 67, team: "ARG", type: "sub", title: "Sub · Fernández ⟶ Paredes" },
];

// FIFA-style knockout bracket. `winner` derives future fixtures.
export type BracketMatch = {
  id: string;
  round: "R16" | "QF" | "SF" | "F";
  home?: string;
  away?: string;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
  kickoff?: string;
  live?: boolean;
};
const R16: BracketMatch[] = [
  { id: "r1", round: "R16", home: "ARG", away: "AUS", homeScore: 2, awayScore: 1, winner: "ARG" },
  { id: "r2", round: "R16", home: "NED", away: "USA", homeScore: 3, awayScore: 1, winner: "NED" },
  { id: "r3", round: "R16", home: "FRA", away: "POL", homeScore: 3, awayScore: 1, winner: "FRA" },
  { id: "r4", round: "R16", home: "ENG", away: "SEN", homeScore: 3, awayScore: 0, winner: "ENG" },
  { id: "r5", round: "R16", home: "CRO", away: "JPN", homeScore: 1, awayScore: 1, winner: "CRO" },
  { id: "r6", round: "R16", home: "BRA", away: "KOR", homeScore: 4, awayScore: 1, winner: "BRA" },
  { id: "r7", round: "R16", home: "MAR", away: "ESP", homeScore: 0, awayScore: 0, winner: "MAR" },
  { id: "r8", round: "R16", home: "POR", away: "SUI", homeScore: 6, awayScore: 1, winner: "POR" },
];
const QF: BracketMatch[] = [
  {
    id: "q1",
    round: "QF",
    home: R16[0].winner,
    away: R16[1].winner,
    homeScore: 2,
    awayScore: 2,
    winner: "ARG",
  },
  {
    id: "q2",
    round: "QF",
    home: R16[2].winner,
    away: R16[3].winner,
    live: true,
    kickoff: "Live · Tonight",
  },
  { id: "q3", round: "QF", home: R16[4].winner, away: R16[5].winner, kickoff: "Tomorrow · 20:00" },
  { id: "q4", round: "QF", home: R16[6].winner, away: R16[7].winner, kickoff: "Tomorrow · 23:30" },
];
const SF: BracketMatch[] = [
  {
    id: "s1",
    round: "SF",
    home: QF[0].winner,
    away: QF[1].winner ?? "TBD",
    kickoff: "Tue · 20:00",
  },
  {
    id: "s2",
    round: "SF",
    home: QF[2].winner ?? "TBD",
    away: QF[3].winner ?? "TBD",
    kickoff: "Wed · 20:00",
  },
];
const F: BracketMatch[] = [
  {
    id: "f1",
    round: "F",
    home: SF[0].winner ?? "TBD",
    away: SF[1].winner ?? "TBD",
    kickoff: "Sun · 20:30",
  },
];
export const BRACKET = { R16, QF, SF, F };
