import { describe, expect, it } from "vitest";
import { lastUpdatedFrom, previousRankingsFromSnapshot } from "./public-ladder";

describe("previousRankingsFromSnapshot", () => {
  it("maps each player id to its rank from the stored snapshot rankings", () => {
    const rankings = [
      { rank: 1, playerId: "a" },
      { rank: 2, playerId: "b" },
      { rank: 3, playerId: "c" },
    ];

    const map = previousRankingsFromSnapshot(rankings);

    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(2);
    expect(map.get("c")).toBe(3);
  });
});

describe("lastUpdatedFrom", () => {
  it("returns the most recent session timestamp", () => {
    const result = lastUpdatedFrom([
      { timestamp: new Date("2026-01-01T00:00:00Z") },
      { timestamp: new Date("2026-03-01T00:00:00Z") },
      { timestamp: new Date("2026-02-01T00:00:00Z") },
    ]);

    expect(result).toEqual(new Date("2026-03-01T00:00:00Z"));
  });

  it("returns null when there are no sessions", () => {
    expect(lastUpdatedFrom([])).toBeNull();
  });
});
