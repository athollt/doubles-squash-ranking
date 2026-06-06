import { describe, it, expect } from "vitest";
import { validateSession } from "@/lib/session-validation";

const four = [
  { playerId: "a", wins: 3 },
  { playerId: "b", wins: 3 },
  { playerId: "c", wins: 1 },
  { playerId: "d", wins: 1 },
];

describe("validateSession", () => {
  it("rejects a session with fewer than 4 players", () => {
    const result = validateSession({ players: four.slice(0, 3) });
    expect(result.ok).toBe(false);
  });

  it("rejects more than 8 players", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      playerId: `p${i}`,
      wins: 2,
    }));
    expect(validateSession({ players: many }).ok).toBe(false);
  });

  it("rejects duplicate players", () => {
    const dup = [...four.slice(0, 3), { playerId: "a", wins: 1 }];
    expect(validateSession({ players: dup }).ok).toBe(false);
  });

  it("rejects negative wins", () => {
    const neg = [
      { playerId: "a", wins: -1 },
      { playerId: "b", wins: 3 },
      { playerId: "c", wins: 2 },
      { playerId: "d", wins: 2 },
    ];
    expect(validateSession({ players: neg }).ok).toBe(false);
  });

  it("rejects non-integer wins", () => {
    const frac = [
      { playerId: "a", wins: 1.5 },
      { playerId: "b", wins: 2.5 },
      { playerId: "c", wins: 2 },
      { playerId: "d", wins: 2 },
    ];
    expect(validateSession({ players: frac }).ok).toBe(false);
  });

  it("rejects an odd total of player wins", () => {
    const odd = [
      { playerId: "a", wins: 3 },
      { playerId: "b", wins: 3 },
      { playerId: "c", wins: 1 },
      { playerId: "d", wins: 2 },
    ];
    expect(validateSession({ players: odd }).ok).toBe(false);
  });

  it("rejects zero total wins", () => {
    const zero = [
      { playerId: "a", wins: 0 },
      { playerId: "b", wins: 0 },
      { playerId: "c", wins: 0 },
      { playerId: "d", wins: 0 },
    ];
    expect(validateSession({ players: zero }).ok).toBe(false);
  });

  it("accepts a valid session and computes derived fields", () => {
    const result = validateSession({ players: four });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.totalPlayerWins).toBe(8);
      expect(result.session.inferredGames).toBe(4);
      expect(result.session.playerCount).toBe(4);
    }
  });
});
