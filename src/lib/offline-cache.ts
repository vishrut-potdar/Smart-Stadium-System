/* eslint-disable no-empty */
// Tiny localStorage-backed cache so NFC directions & maps keep working
// with limited connectivity. Values are versioned so a schema change
// invalidates the cache automatically.
const VERSION = 1;

type Entry<T> = { v: number; at: number; data: T };

export function readCache<T>(key: string): { data: T; at: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`arena.cache.${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (entry.v !== VERSION) return null;
    return { data: entry.data, at: entry.at };
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const entry: Entry<T> = { v: VERSION, at: Date.now(), data };
    localStorage.setItem(`arena.cache.${key}`, JSON.stringify(entry));
  } catch {}
}

export function useOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

export function formatAge(ms: number): string {
  if (!ms) return "just now";
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
