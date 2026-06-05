import { describe, expect, it } from "vitest";
import { recalculate } from "./rating-engine";

const DEFAULT_SETTINGS: Record<string, number> = {
  StartingRating: 1000,
  KFactor: 160,
  NewPlayerMultiplier: 2.0,
  NewPlayerSessions: 5,
  ReturningPlayerMultiplier: 2.0,
  ReturningPlayerSessions: 5,
  BaselineSessionGames: 8,
  MinSessionWeight: 0.6,
  MaxSessionWeight: 1.25,
  ActivityBonusPerSession: 2,
  ActivityBonusWindowDays: 90,
  ActivityBonusCap: 30,
  ActiveThresholdDays: 90,
  LongAbsenceDays: 90,
  StrengthScale: 400,
};

function player(id: string, name = id) {
  return { id, name, status: "ACTIVE" as const };
}

describe("recalculate — expected share", () => {
  it("gives equal expected shares when all players start at the same rating", () => {
    const result = recalculate({
      now: new Date("2026-06-05T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [
        {
          id: "s1",
          timestamp: new Date("2026-06-01T18:00:00Z"),
          players: [
            { playerId: "p1", wins: 3 },
            { playerId: "p2", wins: 3 },
            { playerId: "p3", wins: 3 },
            { playerId: "p4", wins: 3 },
          ],
        },
      ],
    });

    const log = result.ratingsLog.filter((e) => e.sessionId === "s1");
    expect(log).toHaveLength(4);
    for (const entry of log) {
      expect(entry.expectedShare).toBeCloseTo(0.25, 10);
    }
  });
});

describe("recalculate — rating change direction", () => {
  it("rewards a player who wins more than their expected share and penalises the rest", () => {
    const result = recalculate({
      now: new Date("2026-06-05T12:00:00Z"),
      settings: { ...DEFAULT_SETTINGS, NewPlayerSessions: 0 },
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [
        {
          id: "s1",
          timestamp: new Date("2026-06-01T18:00:00Z"),
          players: [
            { playerId: "p1", wins: 6 },
            { playerId: "p2", wins: 2 },
            { playerId: "p3", wins: 2 },
            { playerId: "p4", wins: 2 },
          ],
        },
      ],
    });

    const byId = new Map(result.ratingsLog.map((e) => [e.playerId, e]));
    expect(byId.get("p1")!.ratingAfter).toBeGreaterThan(1000);
    expect(byId.get("p2")!.ratingAfter).toBeLessThan(1000);
    expect(byId.get("p3")!.ratingAfter).toBeLessThan(1000);
    expect(byId.get("p4")!.ratingAfter).toBeLessThan(1000);
  });

  it("conserves rating within a session (changes sum to zero)", () => {
    const result = recalculate({
      now: new Date("2026-06-05T12:00:00Z"),
      settings: { ...DEFAULT_SETTINGS, NewPlayerSessions: 0 },
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [
        {
          id: "s1",
          timestamp: new Date("2026-06-01T18:00:00Z"),
          players: [
            { playerId: "p1", wins: 6 },
            { playerId: "p2", wins: 2 },
            { playerId: "p3", wins: 2 },
            { playerId: "p4", wins: 2 },
          ],
        },
      ],
    });

    const total = result.ratingsLog.reduce((sum, e) => sum + e.ratingChange, 0);
    expect(total).toBeCloseTo(0, 10);
  });
});

function uniformSession(id: string, timestamp: string) {
  return {
    id,
    timestamp: new Date(timestamp),
    players: [
      { playerId: "p1", wins: 3 },
      { playerId: "p2", wins: 3 },
      { playerId: "p3", wins: 3 },
      { playerId: "p4", wins: 3 },
    ],
  };
}

function uniformSessionFor(ids: string[], id: string, timestamp: string) {
  return {
    id,
    timestamp: new Date(timestamp),
    players: ids.map((playerId) => ({ playerId, wins: 3 })),
  };
}

describe("recalculate — new-player multiplier", () => {
  it("applies the 2.0 multiplier for a player's first NewPlayerSessions sessions", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      uniformSession(`s${i + 1}`, `2026-06-0${i + 1}T18:00:00Z`),
    );

    const result = recalculate({
      now: new Date("2026-06-30T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions,
    });

    const p1 = result.ratingsLog.filter((e) => e.playerId === "p1");
    expect(p1).toHaveLength(5);
    for (const entry of p1) {
      expect(entry.multiplier).toBe(2.0);
      expect(entry.isNewOrReturningBoost).toBe(true);
    }
  });

  it("drops the multiplier to 1.0 from the sixth session onwards", () => {
    const sessions = Array.from({ length: 6 }, (_, i) =>
      uniformSession(`s${i + 1}`, `2026-06-0${i + 1}T18:00:00Z`),
    );

    const result = recalculate({
      now: new Date("2026-06-30T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions,
    });

    const sixth = result.ratingsLog.find(
      (e) => e.sessionId === "s6" && e.playerId === "p1",
    )!;
    expect(sixth.multiplier).toBe(1.0);
    expect(sixth.isNewOrReturningBoost).toBe(false);
  });

  it("re-applies the boost when a player returns after a long absence", () => {
    // Six early sessions exhaust the new-player boost...
    const early = Array.from({ length: 6 }, (_, i) =>
      uniformSession(`s${i + 1}`, `2026-01-0${i + 1}T18:00:00Z`),
    );
    // ...then the player returns more than 90 days later.
    const comeback = uniformSession("s7", "2026-05-01T18:00:00Z");

    const result = recalculate({
      now: new Date("2026-06-30T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [...early, comeback],
    });

    const sixth = result.ratingsLog.find(
      (e) => e.sessionId === "s6" && e.playerId === "p1",
    )!;
    const comebackEntry = result.ratingsLog.find(
      (e) => e.sessionId === "s7" && e.playerId === "p1",
    )!;

    expect(sixth.multiplier).toBe(1.0);
    expect(comebackEntry.multiplier).toBe(2.0);
    expect(comebackEntry.isNewOrReturningBoost).toBe(true);
  });
});

describe("recalculate — session weight", () => {
  it("scales session weight with sqrt(inferredGames / baseline)", () => {
    // total wins 18 -> inferredGames 9 -> sqrt(9/8) ≈ 1.0607 (inside the clamp)
    const result = recalculate({
      now: new Date("2026-06-05T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [
        {
          id: "s1",
          timestamp: new Date("2026-06-01T18:00:00Z"),
          players: [
            { playerId: "p1", wins: 6 },
            { playerId: "p2", wins: 6 },
            { playerId: "p3", wins: 3 },
            { playerId: "p4", wins: 3 },
          ],
        },
      ],
    });

    const entry = result.ratingsLog.find((e) => e.playerId === "p1")!;
    expect(entry.inferredGames).toBe(9);
    expect(entry.sessionWeight).toBeCloseTo(Math.sqrt(9 / 8), 10);
  });

  it("clamps the session weight to the configured minimum", () => {
    // total wins 4 -> inferredGames 2 -> sqrt(2/8) = 0.5, below MinSessionWeight 0.6
    const result = recalculate({
      now: new Date("2026-06-05T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [
        {
          id: "s1",
          timestamp: new Date("2026-06-01T18:00:00Z"),
          players: [
            { playerId: "p1", wins: 1 },
            { playerId: "p2", wins: 1 },
            { playerId: "p3", wins: 1 },
            { playerId: "p4", wins: 1 },
          ],
        },
      ],
    });

    expect(result.ratingsLog[0].sessionWeight).toBeCloseTo(0.6, 10);
  });

  it("clamps the session weight to the configured maximum", () => {
    // total wins 40 -> inferredGames 20 -> sqrt(20/8) ≈ 1.58, above MaxSessionWeight 1.25
    const result = recalculate({
      now: new Date("2026-06-05T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [
        {
          id: "s1",
          timestamp: new Date("2026-06-01T18:00:00Z"),
          players: [
            { playerId: "p1", wins: 10 },
            { playerId: "p2", wins: 10 },
            { playerId: "p3", wins: 10 },
            { playerId: "p4", wins: 10 },
          ],
        },
      ],
    });

    expect(result.ratingsLog[0].sessionWeight).toBeCloseTo(1.25, 10);
  });
});

describe("recalculate — activity bonus", () => {
  it("awards BonusPerSession for each session within the activity window", () => {
    const result = recalculate({
      now: new Date("2026-06-30T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [
        uniformSession("s1", "2026-06-01T18:00:00Z"),
        uniformSession("s2", "2026-06-10T18:00:00Z"),
        uniformSession("s3", "2026-06-20T18:00:00Z"),
      ],
    });

    const p1 = result.currentRatings.get("p1")!;
    expect(p1.sessionsLast90Days).toBe(3);
    expect(p1.activityBonus).toBe(6); // 3 × 2
    expect(p1.ladderScore).toBeCloseTo(p1.currentRating + 6, 10);
  });

  it("caps the activity bonus at ActivityBonusCap", () => {
    // 20 sessions in the window → 20 × 2 = 40, capped at 30
    const sessions = Array.from({ length: 20 }, (_, i) => {
      const day = String((i % 28) + 1).padStart(2, "0");
      const month = i < 14 ? "05" : "06";
      return uniformSession(`s${i + 1}`, `2026-${month}-${day}T18:00:00Z`);
    });

    const result = recalculate({
      now: new Date("2026-06-30T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions,
    });

    const p1 = result.currentRatings.get("p1")!;
    expect(p1.sessionsLast90Days).toBe(20);
    expect(p1.activityBonus).toBe(30);
  });
});

describe("recalculate — ladder", () => {
  it("ranks active players above inactive players", () => {
    const result = recalculate({
      now: new Date("2026-06-30T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [
        player("active1"),
        player("active2"),
        player("inactive1"),
        player("inactive2"),
      ],
      sessions: [
        // Recent session — active1 and active2 played in the window.
        {
          id: "recent",
          timestamp: new Date("2026-06-20T18:00:00Z"),
          players: [
            { playerId: "active1", wins: 3 },
            { playerId: "active2", wins: 3 },
            { playerId: "inactive1", wins: 3 },
            { playerId: "inactive2", wins: 3 },
          ],
        },
        // A much later session for the active pair only (others go inactive).
        {
          id: "latest",
          timestamp: new Date("2026-06-25T18:00:00Z"),
          players: [
            { playerId: "active1", wins: 4 },
            { playerId: "active2", wins: 2 },
            { playerId: "inactive1", wins: 0 },
            { playerId: "inactive2", wins: 0 },
          ],
        },
      ],
    });

    // Make inactive pair genuinely inactive by using a far-future "now".
    const aged = recalculate({
      now: new Date("2026-12-31T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [player("recent"), player("old")],
      sessions: [
        // "old" last played in March → >90 days before Dec 31 → inactive.
        uniformSessionFor(["recent", "old"], "rec", "2026-03-01T18:00:00Z"),
        // "recent" played again in December → active.
        uniformSessionFor(["recent"], "rec2", "2026-12-20T18:00:00Z"),
      ],
    });

    const recentEntry = aged.ladder.find((e) => e.playerId === "recent")!;
    const oldEntry = aged.ladder.find((e) => e.playerId === "old")!;
    expect(recentEntry.isActive).toBe(true);
    expect(oldEntry.isActive).toBe(false);
    expect(recentEntry.rank).toBeLessThan(oldEntry.rank);

    // Sanity: ranks are a strict 1..n sequence.
    expect(result.ladder.map((e) => e.rank)).toEqual([1, 2, 3, 4]);
  });

  it("excludes removed players from the ladder but keeps them in current ratings", () => {
    const result = recalculate({
      now: new Date("2026-06-30T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [
        player("p1"),
        player("p2"),
        player("p3"),
        { id: "p4", name: "p4", status: "REMOVED" },
      ],
      sessions: [uniformSession("s1", "2026-06-20T18:00:00Z")],
    });

    expect(result.ladder.map((e) => e.playerId)).not.toContain("p4");
    expect(result.ladder).toHaveLength(3);
    // Removed player still has a computed rating (history is preserved).
    expect(result.currentRatings.get("p4")).toBeDefined();
    expect(result.ratingsLog.some((e) => e.playerId === "p4")).toBe(true);
  });
});

describe("recalculate — movement indicators", () => {
  it("compares current rank to the previous ranking", () => {
    const result = recalculate({
      now: new Date("2026-06-30T12:00:00Z"),
      settings: { ...DEFAULT_SETTINGS, NewPlayerSessions: 0 },
      players: [player("p1"), player("p2"), player("p3"), player("p4")],
      sessions: [
        {
          id: "s1",
          timestamp: new Date("2026-06-20T18:00:00Z"),
          players: [
            { playerId: "p1", wins: 6 },
            { playerId: "p2", wins: 4 },
            { playerId: "p3", wins: 1 },
            { playerId: "p4", wins: 1 },
          ],
        },
      ],
      // Previous ladder: p3 was 1st, p1 was 3rd, p4 brand new.
      previousRankings: new Map([
        ["p3", 1],
        ["p2", 2],
        ["p1", 3],
      ]),
    });

    const byId = new Map(result.ladder.map((e) => [e.playerId, e]));
    // p1 now ranks 1st (was 3rd) → up 2.
    expect(byId.get("p1")!.rank).toBe(1);
    expect(byId.get("p1")!.movement).toEqual({ direction: "up", places: 2 });
    // p2 holds 2nd → no change.
    expect(byId.get("p2")!.movement).toEqual({ direction: "same", places: 0 });
    // p3 dropped from 1st → down.
    expect(byId.get("p3")!.movement.direction).toBe("down");
    // p4 had no previous rank → new.
    expect(byId.get("p4")!.movement).toEqual({ direction: "new", places: 0 });
  });
});

describe("recalculate — golden test (SPEC §2 example)", () => {
  it("produces the exact ratings for the documented example session", () => {
    // SPEC §2: Atholl 2, Philip 6, Mike 2, Mark 2. Total 12 → 6 inferred games.
    const result = recalculate({
      now: new Date("2026-06-05T12:00:00Z"),
      settings: DEFAULT_SETTINGS,
      players: [
        player("atholl"),
        player("philip"),
        player("mike"),
        player("mark"),
      ],
      sessions: [
        {
          id: "s1",
          timestamp: new Date("2026-06-05T10:00:00Z"),
          players: [
            { playerId: "atholl", wins: 2 },
            { playerId: "philip", wins: 6 },
            { playerId: "mike", wins: 2 },
            { playerId: "mark", wins: 2 },
          ],
        },
      ],
    });

    // All start at 1000 (equal strength), so expected share is 0.25 each.
    // sessionWeight = sqrt(6/8); multiplier = 2.0 (all new players); K = 160.
    const sessionWeight = Math.sqrt(6 / 8);
    const philipChange = 160 * sessionWeight * 2 * (6 / 12 - 0.25);
    const otherChange = 160 * sessionWeight * 2 * (2 / 12 - 0.25);

    const log = new Map(result.ratingsLog.map((e) => [e.playerId, e]));
    expect(log.get("philip")!.ratingAfter).toBeCloseTo(1000 + philipChange, 10);
    expect(log.get("atholl")!.ratingAfter).toBeCloseTo(1000 + otherChange, 10);
    expect(log.get("mike")!.ratingAfter).toBeCloseTo(1000 + otherChange, 10);
    expect(log.get("mark")!.ratingAfter).toBeCloseTo(1000 + otherChange, 10);

    // Whole session conserves rating.
    const sum = result.ratingsLog.reduce((s, e) => s + e.ratingChange, 0);
    expect(sum).toBeCloseTo(0, 10);

    // Philip tops the ladder; the rest tie below.
    expect(result.ladder[0].playerId).toBe("philip");
    expect(result.ladder[0].rank).toBe(1);
    expect(result.ladder.every((e) => e.isProvisional)).toBe(true);
  });
});
