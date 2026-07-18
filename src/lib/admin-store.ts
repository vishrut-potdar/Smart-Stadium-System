/* eslint-disable no-empty */
// Client-side admin overrides layered on top of the static match-data.
// Persists to localStorage so admin edits survive reloads and can be
// consumed by Home page components via `useAdminOverrides`.
import { useEffect, useState } from "react";
import {
  FIXTURES,
  POINTS_TABLE,
  TIMELINE,
  BRACKET,
  type TimelineEvent,
  type BracketMatch,
} from "./match-data";

export type Fixture = (typeof FIXTURES)[number];
export type Standing = (typeof POINTS_TABLE)[number];

export type AdminState = {
  fixtures: Fixture[];
  standings: Standing[];
  timeline: TimelineEvent[];
  bracket: {
    R16: BracketMatch[];
    QF: BracketMatch[];
    SF: BracketMatch[];
    F: BracketMatch[];
  };
  broadcastAlerts: {
    id: string;
    tag: string;
    title: string;
    body: string;
    tone: string;
    at: number;
  }[];
};

const KEY = "arena.admin.v1";
const CHANNEL = "arena-admin";
const TOKEN_KEY = "arena.admin.token";
// Soft admin token. Set your own in the UI. Empty string disables the gate.
export const ADMIN_TOKEN = "arena-admin";

function seed(): AdminState {
  return {
    fixtures: FIXTURES.map((f) => ({ ...f })),
    standings: POINTS_TABLE.map((s) => ({ ...s })),
    timeline: TIMELINE.map((t) => ({ ...t })),
    bracket: {
      R16: BRACKET.R16.map((m) => ({ ...m })),
      QF: BRACKET.QF.map((m) => ({ ...m })),
      SF: BRACKET.SF.map((m) => ({ ...m })),
      F: BRACKET.F.map((m) => ({ ...m })),
    },
    broadcastAlerts: [],
  };
}

export function readAdmin(): AdminState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return { ...seed(), ...(JSON.parse(raw) as Partial<AdminState>) } as AdminState;
  } catch {
    return seed();
  }
}

export function writeAdmin(state: AdminState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(CHANNEL));
  } catch {}
}

export function resetAdmin() {
  writeAdmin(seed());
}

export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredToken(t: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TOKEN_KEY, t);
  } catch {}
}

export function useAdmin() {
  const [state, setState] = useState<AdminState>(seed);
  useEffect(() => {
    setState(readAdmin());
    const onChange = () => setState(readAdmin());
    window.addEventListener(CHANNEL, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANNEL, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const update = (fn: (s: AdminState) => AdminState) => {
    const next = fn(readAdmin());
    writeAdmin(next);
    setState(next);
  };
  return {
    state,
    update,
    reset: () => {
      resetAdmin();
      setState(seed());
    },
  };
}
