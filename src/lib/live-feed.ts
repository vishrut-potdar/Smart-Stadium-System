/* eslint-disable no-empty */
import { useEffect, useRef, useState } from "react";

export type Transport = "ws" | "polling" | "connecting";

type Options<T> = {
  endpoint: string; // polling endpoint returning JSON
  wsChannel: string; // channel name sent over WS
  pollMs: number;
  parse?: (raw: unknown) => T;
};

/**
 * Attempts a WebSocket to /api/live/socket subscribing to a channel.
 * If WS fails to open within 2s or errors later, falls back to polling.
 */
export function useLiveFeed<T>({ endpoint, wsChannel, pollMs, parse }: Options<T>) {
  const [data, setData] = useState<T | null>(null);
  const [transport, setTransport] = useState<Transport>("connecting");
  const [updatedAt, setUpdatedAt] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handle = (raw: unknown) => {
      const value = parse ? parse(raw) : (raw as T);
      if (cancelled) return;
      setData(value);
      setUpdatedAt(Date.now());
    };

    const startPolling = () => {
      if (pollTimer.current) return;
      setTransport("polling");
      const run = async () => {
        try {
          const r = await fetch(endpoint, { cache: "no-store" });
          if (!r.ok) return;
          handle(await r.json());
        } catch {}
      };
      run();
      pollTimer.current = setInterval(run, pollMs);
    };

    const stopPolling = () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };

    // Try WS first
    let opened = false;
    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${proto}//${window.location.host}/api/live/socket?channel=${wsChannel}`,
      );
      wsRef.current = ws;
      const openTimeout = setTimeout(() => {
        if (!opened) {
          try {
            ws.close();
          } catch {}
          startPolling();
        }
      }, 2000);
      ws.onopen = () => {
        opened = true;
        clearTimeout(openTimeout);
        setTransport("ws");
        stopPolling();
      };
      ws.onmessage = (e) => {
        try {
          handle(JSON.parse(e.data));
        } catch {}
      };
      ws.onerror = () => {
        clearTimeout(openTimeout);
        startPolling();
      };
      ws.onclose = () => {
        if (!cancelled) startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      stopPolling();
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [endpoint, wsChannel, pollMs, parse]);

  return { data, transport, updatedAt };
}
