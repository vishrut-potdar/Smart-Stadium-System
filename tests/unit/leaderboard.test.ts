import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { scorePrediction, useMe, useLeaderboard, type Fan, type Prediction } from "@/lib/leaderboard";

const KEY_UID = "arena.uid";
const KEY_ME = "arena.me";
const KEY_BOARD = "arena.leaderboard.v1";
const CHANNEL = "arena-leaderboard";

describe("leaderboard scoring rules", () => {
  it("should reward 0 points for incorrect prediction", () => {
    expect(scorePrediction("match", false)).toBe(0);
    expect(scorePrediction("poll", false)).toBe(0);
  });

  it("should reward 10 points for correct match winner", () => {
    expect(scorePrediction("match", true, false)).toBe(10);
  });

  it("should reward 15 points (10 + 5 bonus) for correct match winner with exact score", () => {
    expect(scorePrediction("match", true, true)).toBe(15);
  });

  it("should reward 3 points for correct poll prediction", () => {
    expect(scorePrediction("poll", true)).toBe(3);
  });
});

describe("leaderboard hooks and storage state engine", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("useMe hook", () => {
    it("should return a default anonymous profile when loaded with empty storage", () => {
      const { result } = renderHook(() => useMe());

      expect(result.current.me.uid).toBeDefined();
      expect(result.current.me.name).toBe("You");
      expect(result.current.me.points).toBe(0);
      expect(result.current.me.predictions).toEqual([]);
    });

    it("should allow setting a custom name with 24-character maximum limit", () => {
      const { result } = renderHook(() => useMe());

      act(() => {
        result.current.setName("Super Fanatic 3000!");
      });
      expect(result.current.me.name).toBe("Super Fanatic 3000!");

      // Slicing test (24 characters)
      act(() => {
        result.current.setName("A extremely long username that should be sliced to twenty four");
      });
      expect(result.current.me.name).toBe("A extremely long usernam"); // 24 chars

      // Falsy name defaults to "You"
      act(() => {
        result.current.setName("");
      });
      expect(result.current.me.name).toBe("You");
    });

    it("should submit a prediction and overwrite previous prediction with same id and kind", () => {
      const { result } = renderHook(() => useMe());

      const pred1: Omit<Prediction, "submittedAt"> = {
        id: "match-1",
        kind: "match",
        choice: "Real Madrid",
      };

      act(() => {
        result.current.submitPrediction(pred1);
      });

      expect(result.current.me.predictions.length).toBe(1);
      expect(result.current.me.predictions[0].choice).toBe("Real Madrid");

      // Overwrite check
      const pred2: Omit<Prediction, "submittedAt"> = {
        id: "match-1",
        kind: "match",
        choice: "Barcelona",
      };

      act(() => {
        result.current.submitPrediction(pred2);
      });

      expect(result.current.me.predictions.length).toBe(1);
      expect(result.current.me.predictions[0].choice).toBe("Barcelona");
    });

    it("should resolve predictions and accurately calculate points, streaks, and streak bonuses", () => {
      const { result } = renderHook(() => useMe());

      // 1. Submit match prediction
      act(() => {
        result.current.submitPrediction({
          id: "match-1",
          kind: "match",
          choice: "Arsenal",
        });
      });

      // 2. Resolve correctly (should get 10 points, streak 1, best 1)
      act(() => {
        result.current.resolvePrediction("match-1", "match", "Arsenal");
      });

      expect(result.current.me.points).toBe(10);
      expect(result.current.me.correct).toBe(1);
      expect(result.current.me.streak).toBe(1);
      expect(result.current.me.best).toBe(1);

      // 3. Submit next prediction
      act(() => {
        result.current.submitPrediction({
          id: "poll-1",
          kind: "poll",
          choice: "Yes",
        });
      });

      // 4. Resolve second prediction correctly (consecutive: should get 3 points + 2 streak bonus = 5 points, streak 2)
      act(() => {
        result.current.resolvePrediction("poll-1", "poll", "Yes");
      });

      expect(result.current.me.points).toBe(15); // 10 + 3 + 2 = 15
      expect(result.current.me.correct).toBe(2);
      expect(result.current.me.streak).toBe(2);
      expect(result.current.me.best).toBe(2);

      // 5. Submit third prediction
      act(() => {
        result.current.submitPrediction({
          id: "match-2",
          kind: "match",
          choice: "Draw",
        });
      });

      // 6. Resolve third prediction incorrectly (streak resets to 0, no bonus)
      act(() => {
        result.current.resolvePrediction("match-2", "match", "Chelsea");
      });

      expect(result.current.me.points).toBe(15); // Points remain same
      expect(result.current.me.correct).toBe(2); // Correct count remains same
      expect(result.current.me.streak).toBe(0); // Streak reset
      expect(result.current.me.best).toBe(2); // Best streak preserved

      // Try to resolve an already resolved prediction (should do nothing)
      act(() => {
        result.current.resolvePrediction("match-2", "match", "Chelsea");
      });
      expect(result.current.me.points).toBe(15);
    });

    it("should ignore resolving non-existent predictions", () => {
      const { result } = renderHook(() => useMe());
      act(() => {
        result.current.resolvePrediction("non-existent", "match", "Arsenal");
      });
      expect(result.current.me.points).toBe(0);
    });
  });

  describe("useLeaderboard hook", () => {
    it("should load the initial seed board", () => {
      const { result } = renderHook(() => useLeaderboard());
      // SEED_BOARD has 8 participants + 1 custom "You" user = 9 total
      expect(result.current.length).toBe(9);
    });

    it("should sort leaderboard by points desc, and correct-count desc for ties", () => {
      // Setup mock board with ties
      const mockBoard: Fan[] = [
        { uid: "f-1", name: "Fan 1", predictions: [], points: 20, correct: 2, streak: 0, best: 0 },
        { uid: "f-2", name: "Fan 2", predictions: [], points: 30, correct: 3, streak: 0, best: 0 },
        { uid: "f-3", name: "Fan 3", predictions: [], points: 30, correct: 4, streak: 0, best: 0 }, // Same points, more correct
      ];
      localStorage.setItem(KEY_BOARD, JSON.stringify(mockBoard));

      const { result } = renderHook(() => useLeaderboard());

      // "You" (anon) user is also loaded, with points 0
      const sortedNoMe = result.current.filter((f) => f.uid !== "anon");
      expect(sortedNoMe[0].uid).toBe("f-3"); // 30 pts, 4 correct
      expect(sortedNoMe[1].uid).toBe("f-2"); // 30 pts, 3 correct
      expect(sortedNoMe[2].uid).toBe("f-1"); // 20 pts, 2 correct
    });

    it("should update leaderboard reactively when storage custom event fires", () => {
      const { result } = renderHook(() => useLeaderboard());

      act(() => {
        const nextBoard: Fan[] = [
          { uid: "f-99", name: "Top Dog", predictions: [], points: 100, correct: 10, streak: 5, best: 5 },
        ];
        localStorage.setItem(KEY_BOARD, JSON.stringify(nextBoard));
        window.dispatchEvent(new CustomEvent(CHANNEL));
      });

      expect(result.current[0].uid).toBe("f-99");
      expect(result.current[0].points).toBe(100);
    });
  });

  describe("storage error resilience", () => {
    it("should fallback to seed board if JSON parsing fails", () => {
      localStorage.setItem(KEY_BOARD, "invalid-json-data");
      const { result } = renderHook(() => useLeaderboard());
      // Successfully loads SEED_BOARD (8 items) + "You" = 9
      expect(result.current.length).toBe(9);
    });

    it("should gracefully handle localStorage getItem errors", () => {
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Local storage is disabled");
      });

      const { result } = renderHook(() => useLeaderboard());
      expect(result.current.length).toBe(9); // Correctly returns SEED_BOARD + Me

      getItemSpy.mockRestore();
    });

    it("should gracefully handle localStorage setItem errors during write", () => {
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Local storage is full");
      });

      const { result } = renderHook(() => useMe());

      act(() => {
        result.current.setName("No-op Name");
      });

      // State is updated in hook memory, even if writing to storage fails
      expect(result.current.me.name).toBe("No-op Name");

      setItemSpy.mockRestore();
    });
  });
});
