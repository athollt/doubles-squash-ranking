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

    await runRecalculation(store, new Date("2026-02-01T00:00:00Z"), "league-1");

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

    await runRecalculation(store, new Date("2026-02-01T00:00:00Z"), "league-1");

    expect(snapshot).not.toBeNull();
    expect((snapshot ?? []).length).toBeGreaterThan(0);
  });

  it("recalculates one League in isolation — League A ignores League B's data", async () => {
    const seen: string[] = [];
    // A store that records which leagueId each load was scoped to, so we can
    // assert recalc never reaches across the tenant boundary.
    const store: RecalcStore = {
      loadSettings: async (leagueId) => {
        seen.push(leagueId);
        return { StartingRating: 1000, KFactor: 160 };
      },
      loadPlayers: async (leagueId) => {
        seen.push(leagueId);
        return [
          { id: "a", name: "A", status: "ACTIVE" },
          { id: "b", name: "B", status: "ACTIVE" },
        ];
      },
      loadSessions: async (leagueId) => {
        seen.push(leagueId);
        return [];
      },
      replaceRatingsLog: async () => {},
      createLadderSnapshot: async () => {},
    };

    await runRecalculation(store, new Date("2026-02-01T00:00:00Z"), "league-A");

    expect(seen).toEqual(["league-A", "league-A", "league-A"]);
  });
});
