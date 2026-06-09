-- BSC adoption migration (step 19, ADR-015).
-- Adopts all existing global rows into a single seed "BSC Doubles Squash" League
-- and tightens leagueId to NOT NULL on every domain table. Idempotent-safe on a
-- fresh DB (no rows to back-fill) and correct over live prod data (back-fills the
-- nulls left by step 18). Runs in prod via `prisma migrate deploy`, backup-gated
-- (step 17 / ADR-008) and applied manually.

-- 1. Create the seed League with a fixed id so the back-fill is deterministic.
--    ON CONFLICT no-op makes re-running against an already-seeded DB safe.
INSERT INTO "League" ("id", "name", "displayName", "slug", "createdAt")
VALUES (
  'bsc00000-0000-0000-0000-000000000000',
  'BSC Doubles Squash',
  'Doubles Squash @ BSC',
  'bsc-doubles-squash',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- 2. Back-fill leagueId on every existing row. Settings are adopted here too,
--    becoming this League's settings (now unique on (leagueId, key)).
UPDATE "Player"         SET "leagueId" = 'bsc00000-0000-0000-0000-000000000000' WHERE "leagueId" IS NULL;
UPDATE "Session"        SET "leagueId" = 'bsc00000-0000-0000-0000-000000000000' WHERE "leagueId" IS NULL;
UPDATE "Setting"        SET "leagueId" = 'bsc00000-0000-0000-0000-000000000000' WHERE "leagueId" IS NULL;
UPDATE "RatingsLog"     SET "leagueId" = 'bsc00000-0000-0000-0000-000000000000' WHERE "leagueId" IS NULL;
UPDATE "LadderSnapshot" SET "leagueId" = 'bsc00000-0000-0000-0000-000000000000' WHERE "leagueId" IS NULL;

-- 3. Tighten leagueId to NOT NULL now that every row is populated.
ALTER TABLE "Player"         ALTER COLUMN "leagueId" SET NOT NULL;
ALTER TABLE "Session"        ALTER COLUMN "leagueId" SET NOT NULL;
ALTER TABLE "Setting"        ALTER COLUMN "leagueId" SET NOT NULL;
ALTER TABLE "RatingsLog"     ALTER COLUMN "leagueId" SET NOT NULL;
ALTER TABLE "LadderSnapshot" ALTER COLUMN "leagueId" SET NOT NULL;

-- 4. The leagueId FKs were ON DELETE SET NULL (step 18, when nullable). A tenant
--    FK must not null out on league delete; swap to ON DELETE RESTRICT so a
--    League with rows cannot be deleted out from under its data.
ALTER TABLE "Player"         DROP CONSTRAINT "Player_leagueId_fkey";
ALTER TABLE "Session"        DROP CONSTRAINT "Session_leagueId_fkey";
ALTER TABLE "Setting"        DROP CONSTRAINT "Setting_leagueId_fkey";
ALTER TABLE "RatingsLog"     DROP CONSTRAINT "RatingsLog_leagueId_fkey";
ALTER TABLE "LadderSnapshot" DROP CONSTRAINT "LadderSnapshot_leagueId_fkey";

ALTER TABLE "Player"         ADD CONSTRAINT "Player_leagueId_fkey"         FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Setting"        ADD CONSTRAINT "Setting_leagueId_fkey"        FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session"        ADD CONSTRAINT "Session_leagueId_fkey"        FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RatingsLog"     ADD CONSTRAINT "RatingsLog_leagueId_fkey"     FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LadderSnapshot" ADD CONSTRAINT "LadderSnapshot_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
