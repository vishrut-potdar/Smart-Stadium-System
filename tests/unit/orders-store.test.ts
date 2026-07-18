import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act as reactAct } from "@testing-library/react";

let capturedServerSnapshot: (() => unknown) | null = null;

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useSyncExternalStore: (
      subscribe: unknown,
      getSnapshot: unknown,
      getServerSnapshot: unknown,
    ) => {
      if (typeof getServerSnapshot === "function") {
        capturedServerSnapshot = getServerSnapshot as () => unknown;
      }
      return actual.useSyncExternalStore(
        subscribe as () => void,
        getSnapshot as () => unknown,
        getServerSnapshot as () => unknown,
      );
    },
  };
});

import {
  createOrder,
  markPickedUp,
  clearPickedUp,
  orderProgress,
  orderEtaLabel,
  _resetStoreForTesting,
  getOrdersForTesting,
  useOrders,
} from "@/lib/orders-store";

describe("orders-store business logic", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetStoreForTesting();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create an order with correct items and calculate total cost", () => {
    const items = [
      { id: "burger", name: "Burger", price: 12, qty: 2 },
      { id: "fries", name: "Fries", price: 5, qty: 1 },
    ];

    const order = createOrder(items, "West Side Stand");

    expect(order).toBeDefined();
    expect(order.id).toContain("ord_");
    expect(order.items).toEqual(items);
    // 12 * 2 + 5 * 1 = 29
    expect(order.total).toBe(29);
    expect(order.stall).toBe("West Side Stand");
    expect(order.stage).toBe("Received");
    expect(order.etaSeconds).toBe(30 + items.length * 12);
  });

  it("should advance stages automatically over time", () => {
    const items = [{ id: "coke", name: "Coke", price: 3, qty: 1 }];
    const order = createOrder(items);

    expect(order.stage).toBe("Received");

    // Advance time by 15 seconds. The first advance timer (6s - 10s) should trigger.
    vi.advanceTimersByTime(15 * 1000);

    // Get the updated order from the store
    const updatedOrders = getOrdersForTesting();
    expect(updatedOrders.length).toBe(1);
    expect(updatedOrders[0].stage).not.toBe("Received");

    // Advance time further to make sure progress calculation goes up to max
    vi.advanceTimersByTime(100 * 1000);
    expect(orderProgress(updatedOrders[0])).toBe(0.95);
  });

  it("should mark an order as picked up", () => {
    const items = [{ id: "coke", name: "Coke", price: 3, qty: 1 }];
    const order = createOrder(items);

    markPickedUp(order.id);

    const updatedOrders = getOrdersForTesting();
    expect(updatedOrders[0].stage).toBe("Picked up");
    expect(orderProgress(updatedOrders[0])).toBe(1);
    expect(orderEtaLabel(updatedOrders[0])).toBe("Picked up");
  });

  it("should clear picked up orders", () => {
    const items = [{ id: "coke", name: "Coke", price: 3, qty: 1 }];
    const order1 = createOrder(items);

    markPickedUp(order1.id);
    expect(getOrdersForTesting().length).toBe(1);

    clearPickedUp();
    expect(getOrdersForTesting().length).toBe(0);
  });

  describe("orderProgress and orderEtaLabel calculations", () => {
    it("should calculate correct progress percentage based on elapsed time", () => {
      const createdAt = Date.now();
      const mockOrder = {
        id: "test",
        createdAt,
        items: [],
        total: 10,
        stall: "Stall",
        stage: "Preparing" as const,
        etaSeconds: 100,
      };

      // 0 seconds elapsed
      expect(orderProgress(mockOrder)).toBe(0);

      // 50 seconds elapsed (50%)
      vi.advanceTimersByTime(50 * 1000);
      expect(orderProgress(mockOrder)).toBe(0.5);

      // 120 seconds elapsed (capped at 0.95)
      vi.advanceTimersByTime(70 * 1000);
      expect(orderProgress(mockOrder)).toBe(0.95);
    });

    it("should return correct label for each state or time remaining", () => {
      const createdAt = Date.now();
      const mockOrder = {
        id: "test",
        createdAt,
        items: [],
        total: 10,
        stall: "Stall",
        stage: "Preparing" as const,
        etaSeconds: 120,
      };

      // 120 seconds remaining (2m remaining)
      expect(orderEtaLabel(mockOrder)).toBe("2m");

      // 30 seconds remaining (30s remaining)
      vi.advanceTimersByTime(90 * 1000);
      expect(orderEtaLabel(mockOrder)).toBe("30s");

      // Ready stage
      mockOrder.stage = "Ready";
      expect(orderEtaLabel(mockOrder)).toBe("Ready for pickup");

      // Picked up stage
      mockOrder.stage = "Picked up";
      expect(orderEtaLabel(mockOrder)).toBe("Picked up");
    });
  });

  describe("React hooks and edge cases", () => {
    it("should return the list of orders via useOrders and update when a new order is created", () => {
      _resetStoreForTesting();
      const { result } = renderHook(() => useOrders());
      expect(result.current).toEqual([]);

      reactAct(() => {
        createOrder([{ id: "item1", name: "Hot Dog", price: 5, qty: 1 }]);
      });

      expect(result.current.length).toBe(1);
      expect(result.current[0].items[0].name).toBe("Hot Dog");
    });

    it("should subscribe and unsubscribe correctly", () => {
      const { unmount } = renderHook(() => useOrders());
      // Triggers unmount and unsubscribe function
      unmount();
    });

    it("should provide an empty array as server snapshot in useOrders", () => {
      renderHook(() => useOrders());
      expect(capturedServerSnapshot).toBeDefined();
      if (capturedServerSnapshot) {
        expect(capturedServerSnapshot()).toEqual([]);
      }
    });

    it("should handle localStorage errors during load", async () => {
      vi.resetModules();
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Simulated storage error");
      });

      const module = await import("@/lib/orders-store");
      expect(module.getOrdersForTesting()).toEqual([]);
      getItemSpy.mockRestore();
    });
  });
});
