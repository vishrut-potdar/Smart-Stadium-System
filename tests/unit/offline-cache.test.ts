import { describe, it, expect, beforeEach, vi } from "vitest";
import { readCache, writeCache, formatAge, useOnline } from "@/lib/offline-cache";

describe("offline-cache utility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("writeCache & readCache", () => {
    it("should write and read valid cache entries", () => {
      const key = "test-key";
      const data = { user: "Alice", score: 42 };

      writeCache(key, data);
      const cached = readCache<typeof data>(key);

      expect(cached).not.toBeNull();
      expect(cached?.data).toEqual(data);
      expect(typeof cached?.at).toBe("number");
    });

    it("should invalidate cache if version doesn't match", () => {
      const key = "test-key";
      const data = { user: "Bob" };

      // Write with incompatible version
      const wrongVersionEntry = { v: 999, at: Date.now(), data };
      localStorage.setItem(`arena.cache.${key}`, JSON.stringify(wrongVersionEntry));

      const cached = readCache(key);
      expect(cached).toBeNull();
    });

    it("should return null for non-existent key", () => {
      const cached = readCache("missing-key");
      expect(cached).toBeNull();
    });

    it("should handle JSON parse failures gracefully", () => {
      const key = "invalid-json-key";
      localStorage.setItem(`arena.cache.${key}`, "{invalid-json}");

      const cached = readCache(key);
      expect(cached).toBeNull();
    });
  });

  describe("formatAge", () => {
    it("should return 'just now' if ms is falsy", () => {
      expect(formatAge(0)).toBe("just now");
    });

    it("should format seconds correctly", () => {
      const now = Date.now();
      expect(formatAge(now - 15000)).toBe("15s ago");
    });

    it("should format minutes correctly", () => {
      const now = Date.now();
      expect(formatAge(now - 120 * 1000)).toBe("2m ago");
    });

    it("should format hours correctly", () => {
      const now = Date.now();
      expect(formatAge(now - 3 * 3600 * 1000)).toBe("3h ago");
    });
  });

  describe("useOnline", () => {
    it("should return navigator.onLine value", () => {
      const mockOnLine = vi.spyOn(navigator, "onLine", "get");

      mockOnLine.mockReturnValue(true);
      expect(useOnline()).toBe(true);

      mockOnLine.mockReturnValue(false);
      expect(useOnline()).toBe(false);
    });
  });
});
