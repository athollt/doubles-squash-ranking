// A stored LadderSnapshot's rankings is the LadderEntry[] serialised as JSON; we
// only need the player id and rank to derive movement against a prior snapshot.
type SnapshotRanking = { playerId: string; rank: number };

// Build the previousRankings map (playerId → rank) the rating engine consumes to
// compute movement indicators, from a stored snapshot's rankings JSON.
export function previousRankingsFromSnapshot(
  rankings: SnapshotRanking[],
): Map<string, number> {
  return new Map(rankings.map((r) => [r.playerId, r.rank]));
}

// The "Last updated" footer date: the timestamp of the most recent session, or
// null when there are no sessions yet (empty ladder).
export function lastUpdatedFrom(
  sessions: Array<{ timestamp: Date }>,
): Date | null {
  if (sessions.length === 0) return null;
  return sessions.reduce(
    (latest, s) => (s.timestamp > latest ? s.timestamp : latest),
    sessions[0].timestamp,
  );
}
