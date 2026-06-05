# Step 03: Rating algorithm engine

## Objective
Implement the rating calculation engine as a pure function with comprehensive unit tests.

## Context
- Step 02 delivered: database schema, seed data with default settings.
- The algorithm is fully specified in SPEC-original-google-sheets.md §5–7.
- See DECISIONS.md ADR-001 (full recalculation, no incremental).
- This is the most important step — the core business logic.

## Specification

Create `lib/rating-engine.ts` (or similar) exporting a pure function:

```typescript
type RecalcInput = {
  sessions: Array<{id, timestamp, players: Array<{playerId, wins}>}>;
  settings: Record<string, number>;
};

type RecalcOutput = {
  ratingsLog: Array<RatingsLogEntry>;
  currentRatings: Map<string, PlayerRating>;
  ladder: Array<LadderEntry>;
};
```

### Algorithm implementation (from SPEC §5):

1. **Initial rating**: Every player starts at `settings.StartingRating` (1000).
2. **Process sessions chronologically** (oldest first).
3. For each valid session:
   - Calculate `TotalPlayerWins`, `InferredGames`, `ActualShare` per player.
   - Calculate `StrengthWeight` per player: `EXP((RatingBefore - 1000) / StrengthScale)`.
   - Calculate `ExpectedShare`: `StrengthWeight / SumOfSessionStrengthWeights`.
   - Calculate `SessionWeight`: `MIN(Max, MAX(Min, SQRT(InferredGames / Baseline)))`.
   - Determine `Multiplier`:
     - 2.0 if player has played < `NewPlayerSessions` valid sessions before this one.
     - 2.0 if player is returning after `LongAbsenceDays` gap (for next `ReturningPlayerSessions` sessions).
     - 1.0 otherwise.
   - Calculate `RatingChange`: `KFactor × SessionWeight × Multiplier × (ActualShare - ExpectedShare)`.
   - `RatingAfter = RatingBefore + RatingChange`.
4. **After all sessions processed**, build current ratings:
   - `SessionsPlayed` — count of valid sessions per player.
   - `SessionsLast90Days` — sessions within `ActivityBonusWindowDays`.
   - `LastPlayedDate` — most recent session timestamp.
   - `ActivityBonus`: `MIN(Cap, SessionsLast90Days × BonusPerSession)`.
   - `IsActive`: `DaysSinceLastPlayed <= ActiveThresholdDays`.
   - `LadderScore`: `CurrentRating + ActivityBonus` (for active players).
5. **Build ladder**:
   - Active players sorted by `LadderScore` descending.
   - Inactive players sorted by `LastPlayedDate` descending, listed below active.
   - Removed players excluded.
   - Provisional flag if `SessionsPlayed < NewPlayerSessions`.

### Movement calculation:
- Accept an optional `previousRankings: Map<playerId, rank>`.
- Compare current rank to previous rank to produce ↑N / ↓N / — indicators.

**Behaviours to verify (TDD order):**
1. Single session, all players at 1000 — verify expected shares are equal.
2. Single session — player who wins more than expected share gains rating, others lose.
3. Rating changes sum to zero across all players in a session.
4. New player multiplier (2.0) applied for first 5 sessions.
5. New player multiplier drops to 1.0 from session 6 onwards.
6. Returning player multiplier activates after 90-day gap.
7. Session weight scales with sqrt of inferred games / baseline.
8. Session weight clamped between min and max.
9. Activity bonus calculated correctly and capped.
10. Ladder sorts active above inactive.
11. Ladder excludes removed players.
12. Movement indicators calculated from previous rankings.
13. Full recalculation with multiple sessions produces correct final ratings (golden test with known data from SPEC §2 example).

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-03: rating algorithm engine`
4. Push `at-wip`
