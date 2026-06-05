import {
  recalculate,
  type PlayerInput,
  type SessionInput,
  type RatingsLogEntry,
  type LadderEntry,
} from "@/lib/rating-engine";

// Port over the persistence layer so the orchestration is unit-testable
// without Prisma. The Prisma-backed implementation lives in lib/recalc-store.ts.
export interface RecalcStore {
  loadSettings(): Promise<Record<string, number>>;
  loadPlayers(): Promise<PlayerInput[]>;
  loadSessions(): Promise<SessionInput[]>;
  // Replace the entire RatingsLog with the new entries (delete-all + insert).
  replaceRatingsLog(entries: RatingsLogEntry[]): Promise<void>;
  createLadderSnapshot(ladder: LadderEntry[]): Promise<void>;
}

// Full recalculation (ADR-001): load raw data, run the pure engine, persist the
// fresh RatingsLog and a new LadderSnapshot.
export async function runRecalculation(
  store: RecalcStore,
  now: Date,
): Promise<void> {
  const [settings, players, sessions] = await Promise.all([
    store.loadSettings(),
    store.loadPlayers(),
    store.loadSessions(),
  ]);

  const output = recalculate({ now, settings, players, sessions });

  await store.replaceRatingsLog(output.ratingsLog);
  await store.createLadderSnapshot(output.ladder);
}
