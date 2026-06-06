// Run via tsx (not Playwright's loader) so the generated ESM Prisma client and
// bcrypt load cleanly. Usage: tsx e2e/manage-test-users.ts <setup|teardown>
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/password";
import { TEST_ADMIN, TEST_SCORER, TEST_USER_EMAILS } from "./fixtures";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function setup() {
  for (const u of [TEST_ADMIN, TEST_SCORER]) {
    const passwordHash = await hashPassword(u.password);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, name: u.name },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
  }
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
