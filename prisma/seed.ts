import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/password";
import { DEFAULT_SETTINGS } from "../lib/default-settings";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed the BSC League (step 19 / ADR-015) — fresh dev/E2E DBs get the same
  // single League the adoption migration creates over prod data. Fixed id +
  // slug so re-seeding is idempotent and matches the migration.
  const bscLeagueId = "bsc00000-0000-0000-0000-000000000000";
  await prisma.league.upsert({
    where: { id: bscLeagueId },
    update: {},
    create: {
      id: bscLeagueId,
      name: "BSC Doubles Squash",
      displayName: "Doubles Squash @ BSC",
      slug: "bsc-doubles-squash",
    },
  });

  // Settings belong to the League (unique on (leagueId, key)). find-or-create
  // keeps the seed idempotent.
  for (const setting of DEFAULT_SETTINGS) {
    const existing = await prisma.setting.findFirst({
      where: { leagueId: bscLeagueId, key: setting.key },
    });
    if (!existing) {
      await prisma.setting.create({ data: { ...setting, leagueId: bscLeagueId } });
    }
  }

  // Dev password for local manual sign-in via the Credentials provider.
  // Local-only — production uses Google. Never used in prod.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "localdev";
  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: "atholl@tomlinson.co.za" },
    // Set the hash on update too, so an already-seeded admin gets a password.
    update: { passwordHash },
    create: {
      email: "atholl@tomlinson.co.za",
      name: "Atholl",
      role: "ADMIN",
      passwordHash,
    },
  });
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
