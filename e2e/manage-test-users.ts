// Run via tsx (not Playwright's loader) so the generated ESM Prisma client and
// bcrypt load cleanly. Usage: tsx e2e/manage-test-users.ts <setup|teardown>
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/password";
import {
  TEST_ADMIN,
  TEST_SCORER,
  TEST_USER_EMAILS,
  OTHER_LEAGUE,
} from "./fixtures";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function setup() {
  const created: Record<string, string> = {};
  for (const u of [TEST_ADMIN, TEST_SCORER]) {
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
  // The two fixture users plus any [e2e]-named users created by the user-management spec.
  await prisma.user.deleteMany({ where: { email: { in: TEST_USER_EMAILS } } });
  await prisma.user.deleteMany({ where: { name: { contains: "[e2e]" } } });
  // The ephemeral second league (its grants, if any, cascade with it).
  await prisma.league.deleteMany({ where: { slug: OTHER_LEAGUE.slug } });
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
