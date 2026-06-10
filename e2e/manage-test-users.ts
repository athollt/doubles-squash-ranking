// Run via tsx (not Playwright's loader) so the generated ESM Prisma client and
// bcrypt load cleanly. Usage: tsx e2e/manage-test-users.ts <setup|teardown>
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/password";
import {
  TEST_ADMIN,
  TEST_SCORER,
  TEST_NONSTAFF,
  TEST_USER_EMAILS,
  OTHER_LEAGUE,
} from "./fixtures";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function setup() {
  const created: Record<string, string> = {};
  for (const u of [TEST_ADMIN, TEST_SCORER, TEST_NONSTAFF]) {
    const passwordHash = await hashPassword(u.password);
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, name: u.name },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
      select: { id: true },
    });
    created[u.email] = row.id;
  }

  // Grant the test scorer the seed BSC League (ADR-012) so they keep scorer
  // authority once authz is league-scoped (step 21 wires the gate). Mirrors the
  // step-20 migration back-fill; idempotent on (userId, leagueId). The admin
  // bypasses and needs no grant.
  const bscLeague = await prisma.league.findUnique({
    where: { slug: "bsc-doubles-squash" },
    select: { id: true },
  });
  if (bscLeague) {
    await prisma.leagueScorer.upsert({
      where: {
        userId_leagueId: {
          userId: created[TEST_SCORER.email],
          leagueId: bscLeague.id,
        },
      },
      update: {},
      create: { userId: created[TEST_SCORER.email], leagueId: bscLeague.id },
    });
  }

  // The non-staff user (step 23) starts with NO grant so they hit the bounce
  // page. A prior run's approve-spec would have granted them — clear it to
  // restore the precondition. Also clear any leftover access requests so the
  // duplicate-pending guard doesn't block a fresh request.
  await prisma.leagueScorer.deleteMany({
    where: { userId: created[TEST_NONSTAFF.email] },
  });
  await prisma.accessRequest.deleteMany({
    where: { email: { equals: TEST_NONSTAFF.email, mode: "insensitive" } },
  });

  // A second league the test scorer is NOT granted — used to verify cross-league
  // authz bounces them. No LeagueScorer grant is created for it.
  await prisma.league.upsert({
    where: { slug: OTHER_LEAGUE.slug },
    update: {},
    create: {
      name: OTHER_LEAGUE.name,
      displayName: OTHER_LEAGUE.name,
      slug: OTHER_LEAGUE.slug,
    },
  });
}

async function teardown() {
  // Sessions that involve any [e2e] player: delete them first (cascade removes
  // SessionPlayer + RatingsLog) so the players can then be removed without FK
  // violations.
  const e2ePlayers = await prisma.player.findMany({
    where: { name: { contains: "[e2e]" } },
    select: { id: true },
  });
  const ids = e2ePlayers.map((p) => p.id);
  if (ids.length > 0) {
    const sessions = await prisma.session.findMany({
      where: { sessionPlayers: { some: { playerId: { in: ids } } } },
      select: { id: true },
    });
    await prisma.session.deleteMany({
      where: { id: { in: sessions.map((s) => s.id) } },
    });
  }
  await prisma.player.deleteMany({ where: { name: { contains: "[e2e]" } } });
  // Access requests raised by the non-staff fixture user (step 23): they target
  // the persistent BSC league, so they don't cascade away — remove by email.
  await prisma.accessRequest.deleteMany({
    where: { email: { in: TEST_USER_EMAILS } },
  });
  // The fixture users plus any [e2e]-named users created by the user-management
  // spec or by assign-scorer in the provisioning spec.
  await prisma.user.deleteMany({ where: { email: { in: TEST_USER_EMAILS } } });
  await prisma.user.deleteMany({ where: { name: { contains: "[e2e]" } } });

  // Ephemeral leagues: the fixed OTHER_LEAGUE plus any [e2e]-named league created
  // by the provisioning spec. Settings have an onDelete:Restrict FK (step 19), so
  // remove a league's settings (and grants) before the league itself; LeagueScorer
  // and Player cascade, but Setting does not.
  const e2eLeagues = await prisma.league.findMany({
    where: {
      OR: [{ slug: OTHER_LEAGUE.slug }, { displayName: { contains: "[e2e]" } }],
    },
    select: { id: true },
  });
  const leagueIds = e2eLeagues.map((l) => l.id);
  if (leagueIds.length > 0) {
    await prisma.setting.deleteMany({ where: { leagueId: { in: leagueIds } } });
    await prisma.player.deleteMany({ where: { leagueId: { in: leagueIds } } });
    await prisma.league.deleteMany({ where: { id: { in: leagueIds } } });
  }
}

const mode = process.argv[2];
const run = mode === "teardown" ? teardown : setup;

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
