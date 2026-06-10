// Sample-data seed (step 09.1) — OPT-IN, layered on top of the blank baseline
// (`seed.ts`: settings + admin). Run with `npm run seed:sample`. Idempotent:
// deletes its own sample rows first, then rebuilds the same deterministic set
// (see lib/sample-data.ts). Never touches settings; reuses the seeded admin as
// the session submitter.
//
// Two start states:
//   blank:     prisma migrate dev            (settings + admin only)
//   populated: prisma migrate dev && npm run seed:sample
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { recalculate } from "../lib/rating-engine";
import { generateSampleSessions, SAMPLE_CONFIG } from "../lib/sample-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "atholl@tomlinson.co.za";

async function main() {
  // 1. Submitter: the seeded baseline admin must exist (run `prisma db seed` first).
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    throw new Error(
      `Baseline admin ${ADMIN_EMAIL} not found — run the baseline seed first ` +
        `(npx prisma db seed).`,
    );
  }

  // The BSC League (created by the baseline seed / adoption migration) owns all
  // sample data — there is one League in dev (step 19 / ADR-011).
  const league = await prisma.league.findUnique({
    where: { slug: "bsc-doubles-squash" },
    select: { id: true },
  });
  if (!league) {
    throw new Error(
      "BSC League not found — run the baseline seed first (npx prisma db seed).",
    );
  }
  const leagueId = league.id;

  const settingRows = await prisma.setting.findMany({
    where: { leagueId },
    select: { key: true, value: true },
  });
  if (settingRows.length === 0) {
    throw new Error("No settings found — run the baseline seed first.");
  }
  const settings = Object.fromEntries(settingRows.map((r) => [r.key, r.value]));

  // 2. Idempotent reset: remove only the sample players and their sessions, plus
  //    all derived ratings/snapshots (rebuilt below). Sample players are exactly
  //    the configured roster names; sessions cascade their SessionPlayer/RatingsLog.
  const existing = await prisma.player.findMany({
    where: { name: { in: SAMPLE_CONFIG.roster } },
    select: { id: true },
  });
  if (existing.length > 0) {
    const ids = existing.map((p) => p.id);
    const sampleSessions = await prisma.session.findMany({
      where: { sessionPlayers: { some: { playerId: { in: ids } } } },
      select: { id: true },
    });
    await prisma.session.deleteMany({
      where: { id: { in: sampleSessions.map((s) => s.id) } },
    });
    await prisma.player.deleteMany({ where: { id: { in: ids } } });
  }
  // Derived tables are fully rebuilt by the replay, so clear them (this League's).
  await prisma.ladderSnapshot.deleteMany({ where: { leagueId } });
  await prisma.ratingsLog.deleteMany({ where: { leagueId } });

  // 3. Roster.
  const players = await Promise.all(
    SAMPLE_CONFIG.roster.map((name) =>
      prisma.player.create({
        data: { name, status: "ACTIVE", createdById: admin.id, leagueId },
      }),
    ),
  );
  const idByName = new Map(players.map((p) => [p.name, p.id]));

  // 4. Generate the deterministic schedule and insert each session.
  const generated = generateSampleSessions(SAMPLE_CONFIG);
  for (const g of generated) {
    const totalPlayerWins = g.players.reduce((sum, p) => sum + p.wins, 0);
    await prisma.session.create({
      data: {
        timestamp: new Date(`${g.date}T18:00:00Z`),
        submittedById: admin.id,
        leagueId,
        totalPlayerWins,
        inferredGames: totalPlayerWins / 2,
        playerCount: g.players.length,
        sessionPlayers: {
          create: g.players.map((p) => ({
            playerId: idByName.get(p.name)!,
            wins: p.wins,
          })),
        },
      },
    });
  }

  // 5. Weekly replay: after each week, recalculate with that week's date as `now`
  //    and write a LadderSnapshot, so the ladder's movement (current vs previous
  //    week) is real history. The final RatingsLog reflects every session.
  const playerInputs = players.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }));
  const allSessions = await prisma.session.findMany({
    orderBy: { timestamp: "asc" },
    select: {
      id: true,
      timestamp: true,
      sessionPlayers: { select: { playerId: true, wins: true } },
    },
  });
  const sessionInputs = allSessions.map((s) => ({
    id: s.id,
    timestamp: s.timestamp,
    players: s.sessionPlayers.map((sp) => ({
      playerId: sp.playerId,
      wins: sp.wins,
    })),
  }));

  const weeks = [...new Set(generated.map((g) => g.weekIndex))].sort(
    (a, b) => a - b,
  );
  for (const week of weeks) {
    // The latest session date in this week — the "as of" clock for the snapshot.
    const weekDates = generated
      .filter((g) => g.weekIndex === week)
      .map((g) => new Date(`${g.date}T18:00:00Z`).getTime());
    const now = new Date(Math.max(...weekDates));

    const upTo = sessionInputs.filter((s) => s.timestamp <= now);
    const { ladder } = recalculate({
      now,
      settings,
      players: playerInputs,
      sessions: upTo,
      previousRankings: undefined,
    });
    await prisma.ladderSnapshot.create({ data: { rankings: ladder, leagueId } });
  }

  // 6. Final full recalculation (all sessions) → the live RatingsLog the app reads.
  const finalNow = new Date(
    Math.max(...sessionInputs.map((s) => s.timestamp.getTime())),
  );
  const final = recalculate({
    now: finalNow,
    settings,
    players: playerInputs,
    sessions: sessionInputs,
    previousRankings: undefined,
  });
  await prisma.ratingsLog.createMany({
    data: final.ratingsLog.map((e) => ({ ...e, leagueId })),
  });

  console.log(
    `Sample data: ${players.length} players, ${generated.length} sessions, ` +
      `${weeks.length} weekly snapshots, ${final.ratingsLog.length} ratings-log rows.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
