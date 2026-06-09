# Step 19: BSC adoption migration + per-league recalc & read scoping

## Objective
Adopt all existing live data into a seed "BSC Doubles Squash" League, tighten
`leagueId` to non-null, and make recalculation + the public read paths league-scoped —
with a test asserting **no rating drift** from the migration.

## Context
- Read first: `DECISIONS.md` **ADR-015** (adoption migration), **ADR-011** (per-league
  recalc), **ADR-001/002** (full recalc; computed ladder); `PRD-rungs.md` →
  Implementation → Migration + Tenancy.
- **PREREQUISITE: step 17 backup verification.** This step runs over live prod data.
  Do not execute the prod migration without a verified Fly volume snapshot (per ADR-008
  / step 17). The local/test migration has no such gate.
- Step 18 added nullable `leagueId` everywhere. This step populates and tightens it.
- Recalc store: `lib/recalc-store.ts` (`prismaRecalcStore`) currently `findMany`s
  players/sessions/settings **globally**. Public reads: `lib/public-ladder.ts`,
  `lib/session-history.ts`, `lib/player-trend.ts`.

## Specification
**Data migration** (a Prisma migration + a one-shot data step, or a guarded seed):
- Create one League: name "BSC Doubles Squash", displayName as today, slug
  `bsc-doubles-squash`.
- Back-fill `leagueId` on every `Player`, `Session`, `Setting`, `RatingsLog`,
  `LadderSnapshot` to that League.
- Split the global `Setting` rows into that League's settings (now unique
  `(leagueId, key)`).
- Tighten `leagueId` to **non-nullable** on all five tables once populated.
- Attach current staff to the League (the `LeagueScorer` table arrives in step 20 —
  if step 20 has not landed, record current scorers' emails in CHANGELOG for the
  step-20 grant back-fill; do **not** block on it).

**Read/recalc scoping** (pure-core first):
- `prismaRecalcStore` queries gain `where: { leagueId }`; `recalc` runs for one League.
- `public-ladder` / `session-history` / `player-trend` stores filter by `leagueId`.
- The pure engine and pure aggregation logic are unchanged — only the store inputs
  are now league-scoped.

**Behaviours to verify (TDD order):**
1. Migration test: given representative pre-migration rows (no `leagueId`), after the
   migration every row carries the seed League's id and settings are split correctly.
2. **No rating drift**: recomputing the seed League's ladder post-migration yields
   identical `ratingAfter`/ladder order to a pre-migration baseline fixture.
3. Recalc store scoped: with two Leagues' data present, recalc for League A ignores
   League B's sessions (pure store test with a fake/seeded store).
4. Public ladder/history/trend scoped: each returns only the requested League's rows.

## Validation
```bash
npx prisma migrate dev --name bsc-adoption
npm run build && npm run test
```
No new routes (reads re-scoped, same URLs) → E2E unchanged; re-run `npm run test:e2e`
to prove the existing public journeys still pass against the migrated single-League DB.

## Completion
1. Update `CHANGELOG.md` (record the no-drift assertion result; note prod migration is
   manual + backup-gated).
2. Mark step 19 complete in `RUNGS-PLAN.md`.
3. Commit `step-19: BSC adoption migration + per-league recalc & read scoping`.
4. Push `at-wip`.
