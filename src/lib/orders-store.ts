import { useSyncExternalStore } from "react";

export type OrderStage = "Received" | "Preparing" | "Ready" | "Picked up";
export type OrderItem = { id: string; name: string; price: number; qty: number };
export type Order = {
  id: string;
  createdAt: number;
  items: OrderItem[];
  total: number;
  stall: string;
  stage: OrderStage;
  etaSeconds: number; // total prep+ready duration
};

const KEY = "arena.orders.v1";
const STAGES: OrderStage[] = ["Received", "Preparing", "Ready", "Picked up"];

const listeners = new Set<() => void>();
let state: Order[] = load();

function load(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}
function save() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
function emit() {
  save();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const EMPTY_ARRAY: Order[] = [];

export function useOrders(): Order[] {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY_ARRAY,
  );
}

export function getOrdersForTesting(): Order[] {
  return state;
}

export function createOrder(items: OrderItem[], stall = "Concourse Grill"): Order {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const etaSeconds = 30 + items.length * 12; // demo speed
  const order: Order = {
    id: `ord_${Date.now().toString(36)}`,
    createdAt: Date.now(),
    items,
    total,
    stall,
    stage: "Received",
    etaSeconds,
  };
  state = [order, ...state];
  emit();
  scheduleAdvance(order.id);
  return order;
}

export function markPickedUp(id: string) {
  state = state.map((o) => (o.id === id ? { ...o, stage: "Picked up" as OrderStage } : o));
  emit();
}

export function clearPickedUp() {
  state = state.filter((o) => o.stage !== "Picked up");
  emit();
}

export function _resetStoreForTesting() {
  state = [];
  listeners.clear();
}

function scheduleAdvance(id: string) {
  if (typeof window === "undefined") return;
  const advance = () => {
    const o = state.find((x) => x.id === id);
    if (!o || o.stage === "Picked up") return;
    const nextIdx = STAGES.indexOf(o.stage) + 1;
    const next = STAGES[nextIdx];
    if (!next || next === "Picked up") return;
    state = state.map((x) => (x.id === id ? { ...x, stage: next } : x));
    emit();
    if (next !== "Ready") window.setTimeout(advance, (o.etaSeconds * 1000) / 3);
  };
  window.setTimeout(advance, (state.find((x) => x.id === id)?.etaSeconds ?? 30) * 300); // ~30% to Preparing
  window.setTimeout(advance, (state.find((x) => x.id === id)?.etaSeconds ?? 30) * 800); // ~80% to Ready
}

export function orderProgress(o: Order): number {
  const elapsed = (Date.now() - o.createdAt) / 1000;
  if (o.stage === "Picked up") return 1;
  return Math.min(0.95, elapsed / o.etaSeconds);
}

export function orderEtaLabel(o: Order): string {
  const remaining = Math.max(0, Math.round(o.etaSeconds - (Date.now() - o.createdAt) / 1000));
  if (o.stage === "Ready") return "Ready for pickup";
  if (o.stage === "Picked up") return "Picked up";
  if (remaining < 60) return `${remaining}s`;
  return `${Math.ceil(remaining / 60)}m`;
}
