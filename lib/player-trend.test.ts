import { describe, it, expect } from "vitest";
import {
  buildTrendPoints,
  buildTrendRows,
  type PlayerLogRow,
} from "./player-trend";

const rows: PlayerLogRow[] = [
  {
    timestamp: new Date("2026-02-01T18:00:00Z"),
    ratingBefore: 1000,
    ratingChange: 12.34,
    ratingAfter: 1012.34,
  },
  {
    timestamp: new Date("2026-01-10T18:00:00Z"),
    ratingBefore: 1000,
    ratingChange: 0,
    ratingAfter: 1000,
  },
  {
    timestamp: new Date("2026-03-15T18:00:00Z"),
    ratingBefore: 1012.34,
    ratingChange: -5.5,
    ratingAfter: 1006.84,
  },
];

describe("buildTrendPoints", () => {
  it("returns points oldest → newest, rated to 1dp", () => {
    expect(buildTrendPoints(rows)).toEqual([
      { date: "2026-01-10", rating: 1000 },
      { date: "2026-02-01", rating: 1012.3 },
      { date: "2026-03-15", rating: 1006.8 },
    ]);
  });

  it("returns [] for a player with no log entries", () => {
    expect(buildTrendPoints([])).toEqual([]);
  });
});

describe("buildTrendRows", () => {
  it("returns rows newest → oldest with rounded before/change/after", () => {
    expect(buildTrendRows(rows)).toEqual([
      { date: "2026-03-15", ratingBefore: 1012.3, ratingChange: -5.5, ratingAfter: 1006.8 },
      { date: "2026-02-01", ratingBefore: 1000, ratingChange: 12.3, ratingAfter: 1012.3 },
      { date: "2026-01-10", ratingBefore: 1000, ratingChange: 0, ratingAfter: 1000 },
    ]);
  });
});
