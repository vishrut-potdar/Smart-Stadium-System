import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, Icon, PanelHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import {
  createOrder,
  markPickedUp,
  orderEtaLabel,
  orderProgress,
  useOrders,
  type Order,
} from "@/lib/orders-store";

const MENU = [
  {
    id: "1",
    name: "Signature Beef Slider",
    price: 6.5,
    eta: "8m",
    tag: "Chef's pick",
    stall: "Grill · Concourse 210",
  },
  {
    id: "2",
    name: "Truffle Fries",
    price: 4.0,
    eta: "5m",
    tag: "Vegetarian",
    stall: "Grill · Concourse 210",
  },
  {
    id: "3",
    name: "Craft Lager · Pint",
    price: 5.5,
    eta: "3m",
    tag: "21+",
    stall: "Craft Bar · Level 2",
  },
  {
    id: "4",
    name: "Neapolitan Slice",
    price: 4.5,
    eta: "6m",
    tag: "Vegetarian",
    stall: "Pizza Oven · East",
  },
  {
    id: "5",
    name: "Cold Brew Coffee",
    price: 3.5,
    eta: "2m",
    tag: "Vegan",
    stall: "Coffee Cart · West",
  },
  {
    id: "6",
    name: "Loaded Nachos",
    price: 7.0,
    eta: "9m",
    tag: "Sharing",
    stall: "Grill · Concourse 210",
  },
];

export const Route = createFileRoute("/food")({
  head: () => ({
    meta: [
      { title: "Food · Arena" },
      { name: "description", content: "Skip the line. Pre-order to your seat." },
    ],
  }),
  component: FoodPage,
});

function FoodPage() {
  const orders = useOrders();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const inCart = Object.entries(cart)
    .map(([id, qty]) => {
      const m = MENU.find((x) => x.id === id)!;
      return { id, name: m.name, price: m.price, qty, stall: m.stall };
    })
    .filter((x) => x.qty > 0);
  const total = inCart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = inCart.reduce((s, i) => s + i.qty, 0);

  const checkout = () => {
    if (!inCart.length) return;
    const stall = inCart[0].stall;
    const order = createOrder(
      inCart.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
      stall,
    );
    setCart({});
    setConfirmed(order.id);
    window.setTimeout(() => setConfirmed(null), 4000);
  };

  const active = orders.filter((o) => o.stage !== "Picked up");
  const past = orders.filter((o) => o.stage === "Picked up").slice(0, 3);

  return (
    <>
      <PanelHeader
        eyebrow="Cashless & Pre-order"
        title="Skip the line. Meet it at your seat."
        desc="Order in seconds, pay with a tap, and track every step from kitchen to your row."
      />

      {active.length > 0 && (
        <section className="mb-8" aria-labelledby="active-orders">
          <h2 id="active-orders" className="mb-3 text-sm font-semibold">
            Active orders
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((o) => (
              <OrderTracker key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2" role="list" aria-label="Menu">
          {MENU.map((m) => {
            const qty = cart[m.id] ?? 0;
            return (
              <Card key={m.id} as="article" className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{m.name}</h3>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Ready in {m.eta} · {m.tag}
                    </div>
                    <div className="mt-3 text-base font-semibold">${m.price.toFixed(2)}</div>
                  </div>
                  {qty === 0 ? (
                    <button
                      onClick={() => setCart((c) => ({ ...c, [m.id]: 1 }))}
                      aria-label={`Add ${m.name} to cart`}
                      data-testid={`add-${m.id}`}
                      className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      +
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-1 py-1">
                      <button
                        onClick={() =>
                          setCart((c) => {
                            const next = { ...c, [m.id]: qty - 1 };
                            if (next[m.id] <= 0) delete next[m.id];
                            return next;
                          })
                        }
                        aria-label={`Remove one ${m.name}`}
                        className="grid h-7 w-7 place-items-center rounded-full bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        −
                      </button>
                      <span
                        className="min-w-[1.25rem] text-center text-sm font-medium"
                        aria-live="polite"
                      >
                        {qty}
                      </span>
                      <button
                        onClick={() => setCart((c) => ({ ...c, [m.id]: qty + 1 }))}
                        aria-label={`Add one more ${m.name}`}
                        className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="sticky top-40 h-fit" aria-labelledby="cart-heading">
          <h2 id="cart-heading" className="text-sm font-semibold">
            Your cart
          </h2>
          {count === 0 && !confirmed && (
            <p className="mt-4 text-sm text-muted-foreground">
              Your cart is empty. Add something from the menu to get started.
            </p>
          )}
          {confirmed && (
            <div className="mt-4 rounded-2xl bg-success/10 p-4" role="status">
              <div className="flex items-center gap-2 text-sm font-medium text-success">
                <Icon.Check className="h-4 w-4" /> Order confirmed
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Tracking below — we'll ping you at each stage.
              </p>
            </div>
          )}
          {count > 0 && (
            <>
              <ul className="mt-4 space-y-2 text-sm" data-testid="cart-list">
                {inCart.map((i) => (
                  <li key={i.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {i.qty}× {i.name}
                    </span>
                    <span className="font-medium">${(i.price * i.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold" data-testid="cart-total">
                  ${total.toFixed(2)}
                </span>
              </div>
              <button
                onClick={checkout}
                data-testid="checkout"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Pay with one tap <Icon.Arrow className="h-4 w-4" />
              </button>
            </>
          )}
        </Card>
      </div>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Recent</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {past.map((o) => (
              <li key={o.id} className="rounded-2xl bg-secondary/50 px-4 py-3">
                Picked up · ${o.total.toFixed(2)} · {o.items.length} item
                {o.items.length > 1 ? "s" : ""} · {o.stall}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

const STAGES: Order["stage"][] = ["Received", "Preparing", "Ready", "Picked up"];

function OrderTracker({ order }: { order: Order }) {
  // Force periodic re-render for ETA countdown
  const [, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const pct = orderProgress(order);
  const stageIdx = STAGES.indexOf(order.stage);

  return (
    <Card
      as="article"
      className="p-5"
      data-testid="order-tracker"
      aria-labelledby={`ord-${order.id}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 id={`ord-${order.id}`} className="text-sm font-semibold">
            Order · {order.stall}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.items.length} item{order.items.length > 1 ? "s" : ""} · ${order.total.toFixed(2)}
          </p>
        </div>
        <span
          className={cn(
            "pill",
            order.stage === "Ready" && "bg-success/15 text-success",
            order.stage === "Preparing" && "bg-warning/20 text-warning-foreground",
            order.stage === "Received" && "bg-secondary text-muted-foreground",
            order.stage === "Picked up" && "bg-primary text-primary-foreground",
          )}
          data-testid="order-stage"
          aria-live="polite"
        >
          {order.stage}
        </span>
      </div>

      <ol className="mt-4 flex items-center gap-2" aria-label="Order stages">
        {STAGES.slice(0, 3).map((st, i) => (
          <li key={st} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold",
                i <= stageIdx
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {i < stageIdx ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-[11px]",
                i <= stageIdx ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {st}
            </span>
            {i < 2 && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">ETA</span>
        <span className="font-semibold">{orderEtaLabel(order)}</span>
      </div>

      {order.stage === "Ready" && (
        <button
          onClick={() => markPickedUp(order.id)}
          data-testid="mark-picked"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Mark picked up
        </button>
      )}
    </Card>
  );
}
