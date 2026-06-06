export type PlayerStatus = "ACTIVE" | "REMOVED";

export type PlayerInput = {
  id: string;
  name: string;
  status: PlayerStatus;
};

export type SessionInput = {
  id: string;
  timestamp: Date;
  players: Array<{ playerId: string; wins: number }>;
};

export type RecalcInput = {
  now: Date;
  settings: Record<string, number>;
  players: PlayerInput[];
  sessions: SessionInput[];
  previousRankings?: Map<string, number>;
};

export type Movement = {
  direction: "up" | "down" | "same" | "new";
  places: number;
};

export type RatingsLogEntry = {
  sessionId: string;
  playerId: string;
  ratingBefore: number;
  strengthWeight: number;
  sessionStrengthTotal: number;
  expectedShare: number;
  actualShare: number;
  sessionWeight: number;
  multiplier: number;
  ratingChange: number;
  ratingAfter: number;
  wins: number;
  inferredGames: number;
  isNewOrReturningBoost: boolean;
};

export type PlayerRating = {
  playerId: string;
  name: string;
  status: PlayerStatus;
  currentRating: number;
  sessionsPlayed: number;
  sessionsLast90Days: number;
  lastPlayedDate: Date | null;
  activityBonus: number;
  isActive: boolean;
  ladderScore: number;
};

export type LadderEntry = {
  rank: number;
  playerId: string;
  name: string;
  isActive: boolean;
  isProvisional: boolean;
  ladderScore: number;
  currentRating: number;
  lastPlayedDate: Date | null;
  movement: Movement;
};

export type RecalcOutput = {
  ratingsLog: RatingsLogEntry[];
  currentRatings: Map<string, PlayerRating>;
  ladder: LadderEntry[];
};

export function recalculate(input: RecalcInput): RecalcOutput {
  const { settings } = input;
  const startingRating = settings.StartingRating;
  const strengthScale = settings.StrengthScale;
  const kFactor = settings.KFactor;
  const newPlayerSessions = settings.NewPlayerSessions;
  const newPlayerMultiplier = settings.NewPlayerMultiplier;
  const returningPlayerSessions = settings.ReturningPlayerSessions;
  const returningPlayerMultiplier = settings.ReturningPlayerMultiplier;
  const longAbsenceMs = settings.LongAbsenceDays * 24 * 60 * 60 * 1000;
  const baselineSessionGames = settings.BaselineSessionGames;
  const minSessionWeight = settings.MinSessionWeight;
  const maxSessionWeight = settings.MaxSessionWeight;
  const activityBonusPerSession = settings.ActivityBonusPerSession;
  const activityBonusWindowMs =
    settings.ActivityBonusWindowDays * 24 * 60 * 60 * 1000;
  const activityBonusCap = settings.ActivityBonusCap;
  const activeThresholdMs = settings.ActiveThresholdDays * 24 * 60 * 60 * 1000;

  const ratings = new Map<string, number>();
  const rating = (id: string) => ratings.get(id) ?? startingRating;

  // Count of valid sessions a player has played before the current one.
  const sessionsPlayed = new Map<string, number>();
  const playedBefore = (id: string) => sessionsPlayed.get(id) ?? 0;

  // Per-player last-played time and remaining returning-boost sessions.
  const lastPlayed = new Map<string, number>();
  const returningBoostRemaining = new Map<string, number>();

  // Per-player session timestamps, for activity counting after recalculation.
  const playedAt = new Map<string, number[]>();

  const ratingsLog: RatingsLogEntry[] = [];

  const sessions = [...input.sessions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  for (const session of sessions) {
    const totalPlayerWins = session.players.reduce((sum, p) => sum + p.wins, 0);
    const inferredGames = totalPlayerWins / 2;
    const rawSessionWeight = Math.sqrt(inferredGames / baselineSessionGames);
    const sessionWeight = Math.min(
      maxSessionWeight,
      Math.max(minSessionWeight, rawSessionWeight),
    );

    const strengthWeights = new Map<string, number>();
    let sessionStrengthTotal = 0;
    for (const p of session.players) {
      const w = Math.exp((rating(p.playerId) - startingRating) / strengthScale);
      strengthWeights.set(p.playerId, w);
      sessionStrengthTotal += w;
    }

    for (const p of session.players) {
      const ratingBefore = rating(p.playerId);
      const strengthWeight = strengthWeights.get(p.playerId)!;
      const expectedShare = strengthWeight / sessionStrengthTotal;
      const actualShare = p.wins / totalPlayerWins;

      // Returning-player boost: a long absence (re)arms the counter on return.
      const previousPlay = lastPlayed.get(p.playerId);
      if (
        previousPlay !== undefined &&
        session.timestamp.getTime() - previousPlay >= longAbsenceMs
      ) {
        returningBoostRemaining.set(p.playerId, returningPlayerSessions);
      }

      const isNewBoost = playedBefore(p.playerId) < newPlayerSessions;
      const returningRemaining = returningBoostRemaining.get(p.playerId) ?? 0;
      const isReturningBoost = returningRemaining > 0;
      const isBoost = isNewBoost || isReturningBoost;
      const multiplier = isNewBoost
        ? newPlayerMultiplier
        : isReturningBoost
          ? returningPlayerMultiplier
          : 1;

      const ratingChange =
        kFactor * sessionWeight * multiplier * (actualShare - expectedShare);
      const ratingAfter = ratingBefore + ratingChange;

      ratings.set(p.playerId, ratingAfter);
      sessionsPlayed.set(p.playerId, playedBefore(p.playerId) + 1);
      lastPlayed.set(p.playerId, session.timestamp.getTime());
      const stamps = playedAt.get(p.playerId) ?? [];
      stamps.push(session.timestamp.getTime());
      playedAt.set(p.playerId, stamps);
      if (isReturningBoost) {
        returningBoostRemaining.set(p.playerId, returningRemaining - 1);
      }

      ratingsLog.push({
        sessionId: session.id,
        playerId: p.playerId,
        ratingBefore,
        strengthWeight,
        sessionStrengthTotal,
        expectedShare,
        actualShare,
        sessionWeight,
        multiplier,
        ratingChange,
        ratingAfter,
        wins: p.wins,
        inferredGames,
        isNewOrReturningBoost: isBoost,
      });
    }
  }

  const nowMs = input.now.getTime();
  const currentRatings = new Map<string, PlayerRating>();
  for (const player of input.players) {
    const stamps = playedAt.get(player.id) ?? [];
    const lastPlayedMs = lastPlayed.get(player.id);
    const sessionsLast90Days = stamps.filter(
      (t) => nowMs - t <= activityBonusWindowMs,
    ).length;
    const activityBonus = Math.min(
      activityBonusCap,
      sessionsLast90Days * activityBonusPerSession,
    );
    const isActive =
      lastPlayedMs !== undefined && nowMs - lastPlayedMs <= activeThresholdMs;
    const currentRating = rating(player.id);

    currentRatings.set(player.id, {
      playerId: player.id,
      name: player.name,
      status: player.status,
      currentRating,
      sessionsPlayed: playedBefore(player.id),
      sessionsLast90Days,
      lastPlayedDate: lastPlayedMs !== undefined ? new Date(lastPlayedMs) : null,
      activityBonus,
      isActive,
      ladderScore: currentRating + activityBonus,
    });
  }

  // Build the ladder: active players first (by ladder score desc), then inactive
  // players (by last-played desc). Removed players are excluded. Players with no
  // history are not ranked.
  const ranked = [...currentRatings.values()].filter(
    (r) => r.status !== "REMOVED" && r.lastPlayedDate !== null,
  );

  const active = ranked
    .filter((r) => r.isActive)
    .sort((a, b) => b.ladderScore - a.ladderScore);
  const inactive = ranked
    .filter((r) => !r.isActive)
    .sort(
      (a, b) =>
        (b.lastPlayedDate?.getTime() ?? 0) - (a.lastPlayedDate?.getTime() ?? 0),
    );

  const previousRankings = input.previousRankings;
  const ladder: LadderEntry[] = [...active, ...inactive].map((r, i) => {
    const rank = i + 1;
    const previousRank = previousRankings?.get(r.playerId);
    let movement: Movement;
    if (previousRank === undefined) {
      movement = { direction: "new", places: 0 };
    } else if (previousRank === rank) {
      movement = { direction: "same", places: 0 };
    } else if (rank < previousRank) {
      movement = { direction: "up", places: previousRank - rank };
    } else {
      movement = { direction: "down", places: rank - previousRank };
    }

    return {
      rank,
      playerId: r.playerId,
      name: r.name,
      isActive: r.isActive,
      isProvisional: r.sessionsPlayed < newPlayerSessions,
      ladderScore: r.ladderScore,
      currentRating: r.currentRating,
      lastPlayedDate: r.lastPlayedDate,
      movement,
    };
  });

  return { ratingsLog, currentRatings, ladder };
}
