import {
  recalculate,
  type PlayerInput,
  type SessionInput,
  type RatingsLogEntry,
  type LadderEntry,
} from "@/lib/rating-engine";

// Port over the persistence layer so the orchestration is unit-testable
// without Prisma. The Prisma-backed implementation lives in lib/recalc-store.ts.
// Every method is league-scoped (ADR-011): recalc runs for one League at a time.
export interface RecalcStore {
  loadSettings(leagueId: string): Promise<Record<string, number>>;
  loadPlayers(leagueId: string): Promise<PlayerInput[]>;
  loadSessions(leagueId: string): Promise<SessionInput[]>;
  // Replace this League's RatingsLog with the new entries (delete-all + insert,
  // scoped to the League).
  replaceRatingsLog(leagueId: string, entries: RatingsLogEntry[]): Promise<void>;
  createLadderSnapshot(leagueId: string, ladder: LadderEntry[]): Promise<void>;
}

// Full recalculation (ADR-001), now per-League (ADR-011): load one League's raw
// data, run the pure engine, persist its fresh RatingsLog and a new snapshot.
export async function runRecalculation(
  store: RecalcStore,
  now: Date,
  leagueId: string,
): Promise<void> {
  const [settings, players, sessions] = await Promise.all([
    store.loadSettings(leagueId),
    store.loadPlayers(leagueId),
    store.loadSessions(leagueId),
  ]);

  const output = recalculate({ now, settings, players, sessions });

  await store.replaceRatingsLog(leagueId, output.ratingsLog);
  await store.createLadderSnapshot(leagueId, output.ladder);
}
