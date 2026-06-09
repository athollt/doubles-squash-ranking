# Step 18: Tenancy schema — League + leagueId + per-league Settings

## Objective
Introduce the `League` tenant and add `leagueId` to every domain table — schema only,
no behaviour change yet, so the migration is safe and verifiable in isolation.

## Context
- Read first: `DECISIONS.md` **ADR-011** (League is the single tenant); `CONTEXT-rungs.md`
  (League, Slug, frozen vocab); `PRD-rungs.md` → Implementation Decisions → Tenancy.
- Current schema (`prisma/schema.prisma`): `User`, `Player`, `Setting`, `Session`,
  `SessionPlayer`, `RatingsLog`, `LadderSnapshot`. None carry a tenant column today.
- `Setting` is a global `key`-unique key→value table; it becomes per-league.
- This step lands the columns; **step 19** back-fills them with the seed BSC League
  and flips them non-nullable. Splitting avoids a single risky migration.

## Specification
Add a `League` model: `id`, `name`, `displayName`, `slug` (unique), `createdAt`.

Add a **nullable** `leagueId` (FK → `League`) to: `Player`, `Session`, `Setting`,
`RatingsLog`, `LadderSnapshot`. Keep them nullable in *this* step so the migration
applies cleanly to existing rows (step 19 populates + tightens).

Change uniqueness intent (enforced in step 19 once populated, but declared now where
Prisma allows without breaking existing rows): `Setting` → unique `(leagueId, key)`;
`Player` name uniqueness → scoped `(leagueId, name)` at the application layer
(`createPlayer`/`updatePlayerName` already do case-insensitive checks — they gain a
league filter in step 20/21, not here).

No application code reads `leagueId` yet. Recalc, auth, routing, and pages are
unchanged and must still pass their existing tests.

**Behaviours to verify (TDD order):**
1. A Prisma migration adds `League` and the nullable `leagueId` columns; `prisma
   migrate` applies to a DB holding existing-shaped rows without error (migration test
   or a focused schema test).
2. Existing pure-core tests (rating-engine, recalc, players, users, auth-rules) still
   pass unchanged — proving no behaviour moved.
3. The generated Prisma client exposes `league` relations and `leagueId` (a thin test
   that creates a League + a Player with `leagueId` round-trips).

## Validation
```bash
npx prisma migrate dev --name add-league-tenancy   # locally, against scratch DB
npm run build && npm run test
```
No routes change → **no E2E required** (record in CHANGELOG).

## Completion
1. Update `CHANGELOG.md` (note columns are nullable pending step 19).
2. Mark step 18 complete in `RUNGS-PLAN.md`.
3. Commit `step-18: tenancy schema — League + leagueId + per-league Settings`.
4. Push `at-wip`.
