-- Per-league scorer grants (step 20, ADR-012). Adds the LeagueScorer join and
-- back-fills the current BSC scorers onto the seed BSC League so existing
-- scorers keep their authority once authz is league-scoped (a global ADMIN needs
-- no grant). Idempotent-safe: the back-fill is guarded by the unique index.

-- CreateTable
CREATE TABLE "LeagueScorer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueScorer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueScorer_userId_leagueId_key" ON "LeagueScorer"("userId", "leagueId");

-- AddForeignKey
ALTER TABLE "LeagueScorer" ADD CONSTRAINT "LeagueScorer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueScorer" ADD CONSTRAINT "LeagueScorer_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Back-fill: grant every existing SCORER the seed BSC League (step 19's
-- bsc-doubles-squash). Admins bypass and need no grant. gen_random_uuid() needs
-- pgcrypto, available by default on the target Postgres.
INSERT INTO "LeagueScorer" ("id", "userId", "leagueId", "createdAt")
SELECT gen_random_uuid(), u."id", l."id", CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN "League" l
WHERE u."role" = 'SCORER'
  AND l."slug" = 'bsc-doubles-squash'
ON CONFLICT ("userId", "leagueId") DO NOTHING;
