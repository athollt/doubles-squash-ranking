import { describe, it, expect } from "vitest";
import { recalculate, type PlayerInput } from "@/lib/rating-engine";
import fixture from "./__fixtures__/bsc-pre-migration-ladder.json";

// No-drift guarantee for the BSC adoption migration (step 19, ADR-015).
//
// The fixture is the BSC ladder captured from the LIVE pre-migration data
// (global, no leagueId). The adoption migration only adds a leagueId column to
// each row — it touches no rating-bearing field, and league-scoping merely
// filters the engine's inputs. So recomputing from the same raw input must
// reproduce the captured ladder byte-for-byte. If this fails, the migration (or
// a future engine change) silently moved someone's rating.
describe("BSC adoption migration — no rating drift", () => {
  const input = {
    now: new Date(fixture.now),
    settings: fixture.input.settings as Record<string, number>,
    players: fixture.input.players as PlayerInput[],
    sessions: fixture.input.sessions.map((s) => ({
      id: s.id,
      timestamp: new Date(s.timestamp),
      players: s.players,
    })),
  };

  it("reproduces the captured ladder order exactly", () => {
    const { ladder } = recalculate(input);
    expect(ladder.map((e) => e.playerId)).toEqual(fixture.expected.ladderOrder);
  });

  it("reproduces every player's rating exactly (no drift)", () => {
    const { ladder } = recalculate(input);
    const expected = fixture.expected.ratingAfter as Record<string, number>;
    for (const entry of ladder) {
      expect(entry.currentRating).toBe(expected[entry.playerId]);
    }
  });
});
