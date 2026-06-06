import { describe, expect, it } from "vitest";
import { generateSampleSessions, SAMPLE_CONFIG } from "./sample-data";
import { validateSession } from "./session-validation";

describe("generateSampleSessions — validity", () => {
  it("produces sessions that all pass session validation", () => {
    const sessions = generateSampleSessions(SAMPLE_CONFIG);

    expect(sessions.length).toBeGreaterThan(0);
    for (const s of sessions) {
      const result = validateSession({
        players: s.players.map((p) => ({ playerId: p.name, wins: p.wins })),
      });
      expect(result.ok).toBe(true);
    }
  });
});

describe("generateSampleSessions — determinism", () => {
  it("produces an identical schedule for the same config", () => {
    const a = generateSampleSessions(SAMPLE_CONFIG);
    const b = generateSampleSessions(SAMPLE_CONFIG);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("generateSampleSessions — frequency", () => {
  it("schedules 3-4 sessions in every week of the span", () => {
    const sessions = generateSampleSessions(SAMPLE_CONFIG);
    const perWeek = new Map<number, number>();
    for (const s of sessions) {
      perWeek.set(s.weekIndex, (perWeek.get(s.weekIndex) ?? 0) + 1);
    }
    expect(perWeek.size).toBe(SAMPLE_CONFIG.weeks);
    for (const count of perWeek.values()) {
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(4);
    }
  });
});

describe("generateSampleSessions — inactivity & returning", () => {
  const sessions = generateSampleSessions(SAMPLE_CONFIG);
  const weeksFor = (name: string) =>
    sessions
      .filter((s) => s.players.some((p) => p.name === name))
      .map((s) => s.weekIndex);

  it("stops the inactive players at their cut-off week", () => {
    for (const [name, from] of Object.entries(SAMPLE_CONFIG.inactiveFromWeek)) {
      const weeks = weeksFor(name);
      expect(weeks.length).toBeGreaterThan(0); // they did play early
      expect(Math.max(...weeks)).toBeLessThan(from);
    }
  });

  it("gives the returning player an early stint, a long gap, then a return", () => {
    const { name, lastEarlyWeek, returnWeek } = SAMPLE_CONFIG.returning;
    const weeks = weeksFor(name);
    const early = weeks.filter((w) => w <= lastEarlyWeek);
    const late = weeks.filter((w) => w >= returnWeek);
    const duringGap = weeks.filter(
      (w) => w > lastEarlyWeek && w < returnWeek,
    );
    expect(early.length).toBeGreaterThan(0);
    expect(late.length).toBeGreaterThan(0);
    expect(duringGap.length).toBe(0);
  });
});

describe("generateSampleSessions — session size & style mix", () => {
  const sessions = generateSampleSessions(SAMPLE_CONFIG);

  it("is mostly 4-player but includes 5, 6 and 8-player sessions", () => {
    const counts = sessions.map((s) => s.players.length);
    const fours = counts.filter((c) => c === 4).length;
    expect(fours / counts.length).toBeGreaterThan(0.5);
    expect(counts).toContain(5);
    expect(counts).toContain(6);
    expect(counts).toContain(8);
  });

  it("includes both short (2-2-2) and long (best-of) sessions", () => {
    const totals = sessions.map((s) =>
      s.players.reduce((sum, p) => sum + p.wins, 0),
    );
    // Short ≈ 10-14 player-wins; long ≈ 18+. Both styles must be present.
    expect(totals.some((t) => t <= 14)).toBe(true);
    expect(totals.some((t) => t >= 18)).toBe(true);
  });
});
