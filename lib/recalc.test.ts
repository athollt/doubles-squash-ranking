import { describe, it, expect } from "vitest";
import { runRecalculation } from "@/lib/recalc";
import type { RecalcStore } from "@/lib/recalc";

function makeStore(over: Partial<RecalcStore> = {}): RecalcStore {
  return {
    loadSettings: async () => ({ StartingRating: 1000, KFactor: 160 }),
    loadPlayers: async () => [
      { id: "a", name: "A", status: "ACTIVE" },
      { id: "b", name: "B", status: "ACTIVE" },
      { id: "c", name: "C", status: "ACTIVE" },
      { id: "d", name: "D", status: "ACTIVE" },
    ],
    loadSessions: async () => [
      {
        id: "s1",
        timestamp: new Date("2026-01-01T00:00:00Z"),
        players: [
          { playerId: "a", wins: 3 },
          { playerId: "b", wins: 3 },
          { playerId: "c", wins: 1 },
          { playerId: "d", wins: 1 },
        ],
      },
    ],
    replaceRatingsLog: async () => {},
    createLadderSnapshot: async () => {},
    ...over,
  };
}

describe("runRecalculation", () => {
  it("writes ratings-log entries for the played sessions", async () => {
    let written: unknown[] | null = null;
    const store = makeStore({
      replaceRatingsLog: async (entries) => {
        written = entries;
      },
    });

    await runRecalculation(store, new Date("2026-02-01T00:00:00Z"));

    expect(written).not.toBeNull();
    expect((written ?? []).length).toBeGreaterThan(0);
  });

  it("creates a ladder snapshot from the recalculated ladder", async () => {
    let snapshot: unknown[] | null = null;
    const store = makeStore({
      createLadderSnapshot: async (ladder) => {
        snapshot = ladder;
      },
    });

    await runRecalculation(store, new Date("2026-02-01T00:00:00Z"));

    expect(snapshot).not.toBeNull();
    expect((snapshot ?? []).length).toBeGreaterThan(0);
  });
});
