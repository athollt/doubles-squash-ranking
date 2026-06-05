// Deterministic generator for the sample-data seed (step 09.1). Pure and
// seeded — same config always yields the same schedule — so the seed is
// idempotent and the behaviours are unit-testable without a database. The
// Prisma insert/replay glue lives in prisma/seed-sample.ts.

export type GeneratedSessionPlayer = { name: string; wins: number };

export type GeneratedSession = {
  weekIndex: number;
  // Local-date string (YYYY-MM-DD) for the session; the seed turns it into a Date.
  date: string;
  players: GeneratedSessionPlayer[];
};

export type SampleConfig = {
  roster: string[];
  seed: number;
  // Inclusive week-anchored span. startDate is the first session week's Monday;
  // weeks runs forward from there. Dates are fixed (never "today") for determinism.
  startDate: string;
  weeks: number;
  minSessionsPerWeek: number;
  maxSessionsPerWeek: number;
  // Players who stop playing from `inactiveFromWeek` onward (land in the inactive
  // section once their last play is > ActiveThresholdDays before the anchor).
  inactiveFromWeek: Record<string, number>;
  // A player who plays early, disappears, then returns at `returnWeek` after a
  // long gap (exercises the returning-player boost).
  returning: { name: string; lastEarlyWeek: number; returnWeek: number };
};

// The 10-player roster supplied by the user (display names only — ADR-004).
export const SAMPLE_CONFIG: SampleConfig = {
  roster: [
    "Allan L",
    "Atholl T",
    "Dave G",
    "Dave L",
    "Gary W",
    "Grahame C",
    "Mike P",
    "Mike T",
    "Norval C",
    "Philip T",
  ],
  seed: 20260105,
  startDate: "2026-01-05", // first Monday of 2026
  weeks: 22, // 2026-01-05 .. ~2026-06-01
  minSessionsPerWeek: 3,
  maxSessionsPerWeek: 4,
  // Dave L and Mike T go quiet early enough to be inactive at the anchor.
  // Grahame C is handled by `returning` (out in the middle, back near the end —
  // his return gap leaves him inactive at the anchor too, per the user).
  inactiveFromWeek: {
    "Dave L": 9,
    "Mike T": 7,
  },
  returning: { name: "Grahame C", lastEarlyWeek: 5, returnWeek: 19 },
};

// mulberry32 — small, fast, deterministic PRNG seeded from an integer.
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

// Pick `count` distinct items from `pool` using the rng (Fisher–Yates prefix).
function sample<T>(pool: T[], count: number, rng: () => number): T[] {
  const a = [...pool];
  for (let i = 0; i < count && i < a.length; i++) {
    const j = i + Math.floor(rng() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, count);
}

// Distribute `games` (each = 2 player-wins) across players, biased by skill so
// stronger players win more — keeps the resulting ladder non-flat. The returned
// per-player wins sum to 2*games (an even total), satisfying validation.
function distributeWins(
  players: string[],
  games: number,
  skill: Map<string, number>,
  rng: () => number,
): number[] {
  const wins = new Array(players.length).fill(0);
  const weights = players.map((p) => skill.get(p) ?? 1);
  for (let g = 0; g < games * 2; g++) {
    // Weighted pick of a winner for this game-win.
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rng() * total;
    let idx = 0;
    while (idx < weights.length - 1 && r >= weights[idx]) {
      r -= weights[idx];
      idx++;
    }
    wins[idx]++;
  }
  return wins;
}

export function generateSampleSessions(config: SampleConfig): GeneratedSession[] {
  const rng = makeRng(config.seed);

  // Deterministic per-player skill (1.4 down to ~0.6 across the roster) so the
  // ladder has a clear order rather than random noise.
  const skill = new Map<string, number>();
  config.roster.forEach((name, i) => {
    skill.set(name, 1.4 - (i / (config.roster.length - 1)) * 0.8);
  });

  const sessions: GeneratedSession[] = [];

  for (let week = 0; week < config.weeks; week++) {
    // Roster available this week: drop players gone inactive, handle the
    // returning player's mid-span absence.
    const available = config.roster.filter((name) => {
      const goneFrom = config.inactiveFromWeek[name];
      if (goneFrom !== undefined && week >= goneFrom) return false;
      if (name === config.returning.name) {
        if (week > config.returning.lastEarlyWeek && week < config.returning.returnWeek) {
          return false;
        }
      }
      return true;
    });

    const sessionsThisWeek =
      config.minSessionsPerWeek +
      Math.floor(
        rng() * (config.maxSessionsPerWeek - config.minSessionsPerWeek + 1),
      );

    for (let s = 0; s < sessionsThisWeek; s++) {
      // Player count: mostly 4, occasionally 5/6/8.
      const roll = rng();
      let count: number;
      if (roll < 0.7) count = 4;
      else if (roll < 0.82) count = 5;
      else if (roll < 0.93) count = 6;
      else count = 8;
      count = Math.min(count, available.length);
      if (count < 4) continue; // not enough players this week for a valid session

      const chosen = sample(available, count, rng);

      // Style: most sessions short (2-2-2 ≈ 6 games), a minority long (best-of).
      const long = rng() < 0.25;
      const games = long ? 9 + Math.floor(rng() * 4) : 5 + Math.floor(rng() * 3);

      const winCounts = distributeWins(chosen, games, skill, rng);

      // Spread sessions across the week (Mon/Wed/Fri-ish).
      const dayOffset = week * 7 + Math.min(6, s * 2);

      sessions.push({
        weekIndex: week,
        date: addDays(config.startDate, dayOffset),
        players: chosen.map((name, i) => ({ name, wins: winCounts[i] })),
      });
    }
  }

  return sessions;
}
