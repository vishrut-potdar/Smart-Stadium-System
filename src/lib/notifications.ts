/* eslint-disable no-empty */
// Native browser notifications for FIFA match events. Purely client-side —
// falls back gracefully when the Notification API is unavailable or permission
// is not granted, so it works without a push server.

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

const NOTIFY_TAGS = new Set(["GOAL", "VAR", "Kick-off", "Half-time", "Full-time"]);

export function getNotifPermission(): NotifPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotifPermission;
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission as NotifPermission;
  }
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

type MatchAlert = { id: string; tag: string; title: string; body: string };

const seen = new Set<string>();

export function maybeNotify(alert: MatchAlert): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!NOTIFY_TAGS.has(alert.tag)) return;
  // Only notify when the tab isn't foregrounded, unless it's a GOAL.
  if (document.visibilityState === "visible" && alert.tag !== "GOAL") return;
  if (seen.has(alert.id)) return;
  seen.add(alert.id);
  try {
    const n = new Notification(`⚽ ${alert.title}`, {
      body: alert.body,
      tag: `arena-${alert.tag}`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      // Renotify so goal updates surface even if a prior notification is up.
      renotify: alert.tag === "GOAL" || alert.tag === "VAR",
    } as NotificationOptions);
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {}
}
