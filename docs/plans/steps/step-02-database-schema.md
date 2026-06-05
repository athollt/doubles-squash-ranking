# Step 02: Database schema & Prisma setup

## Objective
Define the complete Prisma schema and generate the initial migration.

## Context
- Step 01 delivered: project scaffold, Prisma initialised, Docker Postgres running.
- See PRD § Implementation Decisions → Data Model.
- See DECISIONS.md ADR-002 (current_ratings/ladder are computed, not stored), ADR-003 (no invalid sessions stored), ADR-004 (players not linked to users).

## Specification

Define these models in `prisma/schema.prisma`:

### `User` (authenticated accounts)
- `id` — UUID, default auto-generated
- `email` — String, unique
- `name` — String
- `role` — Enum: `ADMIN`, `SCORER`
- `createdAt` — DateTime

### `Player`
- `id` — UUID, default auto-generated
- `name` — String
- `status` — Enum: `ACTIVE`, `REMOVED` (default ACTIVE)
- `createdAt` — DateTime
- `createdById` — UUID, FK to User (nullable — for seed data)

### `Setting`
- `id` — UUID
- `key` — String, unique
- `value` — Float
- `description` — String (optional)

### `Session`
- `id` — UUID
- `timestamp` — DateTime (when the session was played)
- `submittedById` — UUID, FK to User
- `notes` — String (optional)
- `totalPlayerWins` — Int
- `inferredGames` — Int
- `playerCount` — Int
- `createdAt` — DateTime
- `updatedAt` — DateTime

### `SessionPlayer`
- `id` — UUID
- `sessionId` — FK to Session (cascade delete)
- `playerId` — FK to Player
- `wins` — Int
- Unique constraint on (sessionId, playerId)

### `RatingsLog`
- `id` — UUID
- `sessionId` — FK to Session (cascade delete)
- `playerId` — FK to Player
- `ratingBefore` — Float
- `strengthWeight` — Float
- `sessionStrengthTotal` — Float
- `expectedShare` — Float
- `actualShare` — Float
- `sessionWeight` — Float
- `multiplier` — Float
- `ratingChange` — Float
- `ratingAfter` — Float
- `wins` — Int
- `inferredGames` — Int
- `isNewOrReturningBoost` — Boolean

### `LadderSnapshot`
- `id` — UUID
- `createdAt` — DateTime
- `rankings` — JSON (array of {playerId, rank, ladderScore})

### Seed file
- `prisma/seed.ts` — seeds:
  - Default settings (all values from SPEC §4.2).
  - First admin user: `atholl@tomlinson.co.za`, role ADMIN.

**Behaviours to verify (TDD order):**
1. `npx prisma migrate dev --name init` creates the migration without errors.
2. `npx prisma db seed` inserts default settings and admin user.
3. Prisma Client can query `User`, `Player`, `Setting`, `Session`, `SessionPlayer`, `RatingsLog`, `LadderSnapshot` without type errors (write a simple integration test).

## Validation
```bash
docker compose up -d postgres
npx prisma migrate dev --name init
npx prisma db seed
npm run test
npm run build
docker compose down
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-02: database schema & Prisma setup`
4. Push `at-wip`
