# Step 09.1: Sample data seed (full-system test data)

## Objective
Make the whole system demoable and verifiable end-to-end by seeding a realistic
half-year of play. Step 09 shipped the ladder but there is no data to look at;
steps 10–11 (session history, player trend) can't be eyeballed without it. This
step adds an **opt-in sample seed** on top of the blank baseline.

## Context
- `prisma/seed.ts` is the **blank baseline**: 15 settings (SPEC §4.2) + the admin
  user. It is wired as the `migrations.seed` hook in `prisma.config.ts`, so it runs
  automatically on `prisma migrate dev` / `prisma db seed`. **Do not add sample data
  here** — a fresh migrate must still give a blank, production-shaped DB.
- The rating engine (`lib/rating-engine.ts`) infers `games = totalPlayerWins / 2`;
  a session's per-player wins must sum to an **even, positive** total (ADR-003 /
  `lib/session-validation.ts`: 4–8 players, no dupes, integer wins ≥ 0, even total).
- A `Session` requires a non-null `submittedById` (FK → `User`).
- The ladder page (step 09) recomputes live and reads movement from the
  **2nd-most-recent `LadderSnapshot`**. Meaningful movement therefore needs a
  **history of snapshots**, not one.
- `runRecalculation(store, now)` (`lib/recalc.ts`) loads all data, runs the engine,
  replaces `RatingsLog`, writes one `LadderSnapshot`. It is the orchestrator the
  sample seed reuses — once per simulated week — to build snapshot history.

## Decisions (locked with the user)
1. **Split seeds.** Baseline stays in `prisma/seed.ts` (auto-run, blank). Sample
   data goes in a **new** `prisma/seed-sample.ts`, run via `npm run seed:sample`,
   layered on top of the baseline. Two start states:
   - **Blank**: `prisma migrate dev` (or `prisma db seed`) → settings + admin only.
   - **Populated**: blank, then `npm run seed:sample`.
2. **Scoring model: wins per player, plausible spreads.** No per-game simulation.
   Each player in a session gets an integer win count; totals are kept even.
   "2-2-2 style" = a short balanced session (~6 total wins across 4 players, e.g.
   `2,2,1,1`); "best of 5/7" = a longer, more skewed session (higher total, e.g.
   `5,4,2,1` or `7,5,3,1`). Most sessions have 4 players; some have 5, 6, or 8.
3. **Snapshot per week (full history).** Replay sessions in chronological weekly
   batches; after each week call `runRecalculation` so a `LadderSnapshot` is written
   per week. Final `RatingsLog` reflects every session; the ladder's movement
   (current vs previous week) is real.
4. **Span & inactivity.** 3–4 sessions/week from **2026-01-05** to a fixed anchor
   near "today" (**2026-06-05**, the project's current date — see Determinism).
   10 players. **Dave L and Mike T go inactive** (stop playing > `ActiveThresholdDays`
   = 90 days before the anchor → land in the inactive section). **Grahame C returns**
   after a > `LongAbsenceDays` = 90-day gap and resumes *within* 90 days of the
   anchor, so he is **currently active with the returning-player boost** applied
   (resolved with the user: returning + active, not inactive).

## Roster
Use the 10 names supplied by the user (display names only — ADR-004, no User link):
`Allan L`, `Atholl T`, `Dave G`, `Dave L`, `Gary W`, `Grahame C`, `Mike P`,
`Mike T`, `Norval C`, `Philip T`.

## Determinism (design constraint, not a behaviour)
The sample seed MUST be **deterministic and idempotent**:
- Session timestamps are anchored to **fixed 2026 dates**, never `new Date()` /
  "today". The anchor (last simulated week) is **2026-06-05**.
- Win spreads come from a **seeded PRNG** (fixed seed), not `Math.random()`.
- Re-running `seed:sample` rebuilds the same sample set (delete sample rows first,
  then re-insert) so it is safe to run repeatedly. The baseline (settings/admin) is
  never touched by the sample seed.
- The only non-deterministic input is the engine's `now` passed to
  `runRecalculation` per week — pass the **simulated week's date**, not the wall
  clock, so "active/inactive" and the activity bonus are computed as-of that week
  (this is what makes the weekly snapshots — and the inactive players — correct).

## Specification

### A. Scripts & wiring
- `prisma/seed-sample.ts`: standalone script (same Prisma client construction as
  `seed.ts`). Adds the roster, generates the session schedule, inserts sessions +
  `SessionPlayer` rows, and replays weekly recalculations to build snapshot history.
- `package.json`: add `"seed:sample": "tsx prisma/seed-sample.ts"`.
- Sample players are tagged so the seed can clean only its own rows on re-run
  (e.g. a `createdBy` = the seeded admin, or a name set it owns). Document the tag.

### B. Schedule generation (deterministic)
- Weeks from 2026-01-05 to 2026-06-05; 3–4 sessions per week (seeded PRNG).
- Per session: pick 4 players by default, occasionally 5/6/8, from the
  *currently-active* roster for that week. Most sessions 2-2-2 short; a minority
  best-of-5/7 long. Win spreads even-totalled and plausible (stronger players win
  more often, so the ladder isn't flat).
- 2–3 named players stop appearing after a chosen mid-span week; 1 player has a
  > 90-day gap then returns near the end.

### C. Replay & snapshots
- Insert all sessions, then for each week in order call
  `runRecalculation(prismaRecalcStore, <that week's date>)`. The final state is the
  live DB the ladder reads; intermediate snapshots give movement history.

## Behaviours to verify (TDD order)
The deterministic generator is the testable seam (the DB insert/replay is glue,
verified by running the seed + the existing E2E). Extract schedule/score generation
into a **pure** module (e.g. `lib/sample-data.ts`) and unit-test:
1. Every generated session passes `validateSession` (4–8 players, even positive
   total, no duplicate players).
2. The generator is deterministic — same seed ⇒ identical schedule (sessions,
   players, wins).
3. Session count matches 3–4 per week across the configured span.
4. The designated inactive players have **no sessions** after their cut-off week;
   the returning player has a > 90-day gap then resumes.
5. Player counts include the required mix: majority 4, with at least one each of
   5, 6, and 8.
6. Session styles include both short (2-2-2) and long (best-of) totals.

Then a thin integration check (run the seed against the local DB, or a small
"applies cleanly" test) plus the **existing step-09 ladder E2E** confirm the data
renders. Re-running `seed:sample` must leave the same row counts (idempotent).

## Validation
```bash
npm run test                # unit: sample-data generator behaviours
npm run build
# manual / integration:
npm run seed:sample         # populates; re-run → idempotent (same counts)
npm run seed:sample         # second run, assert no growth
npm run test:e2e            # ladder + existing journeys still pass
```
Manual: load `/` — active players ranked with real movement vs last week, 2–3 in
the inactive section, provisional markers only on genuinely new players.

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-09.1: sample data seed`
4. Push `at-wip`
