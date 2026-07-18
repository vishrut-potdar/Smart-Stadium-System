/* eslint-disable no-empty */
// Predictions leaderboard — anonymous user id, poll & match predictions,
// scoring rules, all client-side via localStorage so it works without a
// backend. Multi-tab safe via the storage event.
import { useEffect, useState } from "react";

export type Prediction = {
  id: string; // poll or match id
  kind: "poll" | "match";
  choice: string; // option label chosen
  submittedAt: number;
  resolved?: {
    correct: boolean;
    winner: string;
    points: number; // points awarded
  };
};

export type Fan = {
  uid: string;
  name: string;
  predictions: Prediction[];
  points: number;
  correct: number;
  streak: number;
  best: number;
};

const KEY_UID = "arena.uid";
const KEY_ME = "arena.me";
const KEY_BOARD = "arena.leaderboard.v1";
const CHANNEL = "arena-leaderboard";

const SEED_BOARD: Fan[] = [
  { uid: "seed-1", name: "Diego M.", predictions: [], points: 62, correct: 7, streak: 4, best: 5 },
  { uid: "seed-2", name: "Amelia R.", predictions: [], points: 54, correct: 6, streak: 2, best: 4 },
  { uid: "seed-3", name: "Kenji T.", predictions: [], points: 48, correct: 6, streak: 1, best: 3 },
  { uid: "seed-4", name: "Priya N.", predictions: [], points: 41, correct: 5, streak: 3, best: 3 },
  { uid: "seed-5", name: "Marta G.", predictions: [], points: 37, correct: 5, streak: 0, best: 4 },
  { uid: "seed-6", name: "Wale O.", predictions: [], points: 33, correct: 4, streak: 1, best: 2 },
  { uid: "seed-7", name: "Nour B.", predictions: [], points: 29, correct: 4, streak: 0, best: 2 },
  { uid: "seed-8", name: "Jonas S.", predictions: [], points: 24, correct: 3, streak: 0, best: 2 },
];

const ANONYMOUS_ME: Fan = {
  uid: "anon",
  name: "You",
  predictions: [],
  points: 0,
  correct: 0,
  streak: 0,
  best: 0,
};

function readBoard(): Fan[] {
  if (typeof window === "undefined") return SEED_BOARD;
  try {
    const raw = localStorage.getItem(KEY_BOARD);
    if (!raw) return SEED_BOARD;
    return JSON.parse(raw) as Fan[];
  } catch {
    return SEED_BOARD;
  }
}

function writeBoard(board: Fan[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_BOARD, JSON.stringify(board));
    window.dispatchEvent(new CustomEvent(CHANNEL));
  } catch {}
}

function ensureMe(): Fan {
  if (typeof window === "undefined") return ANONYMOUS_ME;
  try {
    let uid = localStorage.getItem(KEY_UID);
    if (!uid) {
      uid = "u-" + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(KEY_UID, uid);
    }
    const raw = localStorage.getItem(KEY_ME);
    if (raw) {
      try {
        return JSON.parse(raw) as Fan;
      } catch {}
    }
    const me: Fan = { uid, name: "You", predictions: [], points: 0, correct: 0, streak: 0, best: 0 };
    localStorage.setItem(KEY_ME, JSON.stringify(me));
    return me;
  } catch {
    return ANONYMOUS_ME;
  }
}

function writeMe(me: Fan) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_ME, JSON.stringify(me));
    // Merge me into board
    const board = readBoard().filter((f) => f.uid !== me.uid);
    board.push(me);
    writeBoard(board);
  } catch {}
}

// SCORING RULES (feature memory)
// - Correct match winner: +10, +5 bonus for exact score
// - Correct poll majority pick: +3
// - Streak bonus: +2 per consecutive correct
export function scorePrediction(kind: "poll" | "match", correct: boolean, exact = false) {
  if (!correct) return 0;
  if (kind === "match") return 10 + (exact ? 5 : 0);
  return 3;
}

export function useMe() {
  const [me, setMe] = useState<Fan>(ANONYMOUS_ME);
  useEffect(() => {
    setMe(ensureMe());
    const onChange = () => setMe(ensureMe());
    window.addEventListener(CHANNEL, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANNEL, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return {
    me,
    setName: (name: string) => {
      const next = { ...ensureMe(), name: name.slice(0, 24) || "You" };
      writeMe(next);
      setMe(next);
    },
    submitPrediction: (p: Omit<Prediction, "submittedAt">) => {
      const cur = ensureMe();
      const others = cur.predictions.filter((x) => !(x.id === p.id && x.kind === p.kind));
      const next: Fan = {
        ...cur,
        predictions: [...others, { ...p, submittedAt: Date.now() }],
      };
      writeMe(next);
      setMe(next);
    },
    resolvePrediction: (id: string, kind: "poll" | "match", winner: string, exact = false) => {
      const cur = ensureMe();
      const pred = cur.predictions.find((x) => x.id === id && x.kind === kind);
      if (!pred || pred.resolved) return;
      const correct = pred.choice.trim().toLowerCase() === winner.trim().toLowerCase();
      const pts = scorePrediction(kind, correct, exact);
      const streak = correct ? cur.streak + 1 : 0;
      const bonus = correct && streak > 1 ? 2 : 0;
      const total = pts + bonus;
      pred.resolved = { correct, winner, points: total };
      const next: Fan = {
        ...cur,
        predictions: cur.predictions.map((x) => (x === pred ? pred : x)),
        points: cur.points + total,
        correct: cur.correct + (correct ? 1 : 0),
        streak,
        best: Math.max(cur.best, streak),
      };
      writeMe(next);
      setMe(next);
    },
  };
}

export function useLeaderboard() {
  const [board, setBoard] = useState<Fan[]>(SEED_BOARD);
  useEffect(() => {
    const refresh = () => {
      const b = readBoard();
      const me = ensureMe();
      setBoard([...b.filter((f) => f.uid !== me.uid), me]);
    };
    refresh();
    window.addEventListener(CHANNEL, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANNEL, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return board.sort((a, b) => b.points - a.points || b.correct - a.correct);
}
