export interface SessionPlayerInput {
  playerId: string;
  wins: number;
}

export interface SessionInputForValidation {
  players: SessionPlayerInput[];
}

export interface ValidatedSession {
  players: SessionPlayerInput[];
  totalPlayerWins: number;
  inferredGames: number;
  playerCount: number;
}

export type SessionValidationResult =
  | { ok: true; session: ValidatedSession }
  | { ok: false; error: string };

// Validation rules from SPEC § Validation Rules / ADR-003 (reject at submission).
export function validateSession(
  input: SessionInputForValidation,
): SessionValidationResult {
  const { players } = input;
  if (players.length < 4 || players.length > 8) {
    return { ok: false, error: "A session needs 4 to 8 players." };
  }
  const ids = new Set(players.map((p) => p.playerId));
  if (ids.size !== players.length) {
    return { ok: false, error: "A player can only appear once per session." };
  }
  for (const p of players) {
    if (!Number.isInteger(p.wins) || p.wins < 0) {
      return { ok: false, error: "Wins must be whole numbers of 0 or more." };
    }
  }
  const totalPlayerWins = players.reduce((sum, p) => sum + p.wins, 0);
  if (totalPlayerWins === 0) {
    return { ok: false, error: "Total wins must be greater than zero." };
  }
  if (totalPlayerWins % 2 !== 0) {
    return { ok: false, error: "Total wins must be even (two per game)." };
  }
  return {
    ok: true,
    session: {
      players,
      totalPlayerWins,
      inferredGames: totalPlayerWins / 2,
      playerCount: players.length,
    },
  };
}
