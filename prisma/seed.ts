import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Default settings — values from SPEC §4.2.
const defaultSettings: { key: string; value: number; description: string }[] = [
  { key: "StartingRating", value: 1000, description: "Rating every player starts at" },
  { key: "KFactor", value: 160, description: "Sensitivity of rating change per session" },
  { key: "NewPlayerMultiplier", value: 2.0, description: "Rating multiplier for new players" },
  { key: "NewPlayerSessions", value: 5, description: "Sessions a new player receives the multiplier" },
  { key: "ReturningPlayerMultiplier", value: 2.0, description: "Rating multiplier for returning players" },
  { key: "ReturningPlayerSessions", value: 5, description: "Sessions a returning player receives the multiplier" },
  { key: "BaselineSessionGames", value: 8, description: "Inferred games a baseline session represents" },
  { key: "MinSessionWeight", value: 0.6, description: "Lower bound on session weight" },
  { key: "MaxSessionWeight", value: 1.25, description: "Upper bound on session weight" },
  { key: "ActivityBonusPerSession", value: 2, description: "Activity bonus per recent session" },
  { key: "ActivityBonusWindowDays", value: 90, description: "Window for counting recent sessions" },
  { key: "ActivityBonusCap", value: 30, description: "Maximum activity bonus" },
  { key: "ActiveThresholdDays", value: 90, description: "Days since last play to remain active" },
  { key: "LongAbsenceDays", value: 90, description: "Absence that triggers the returning-player boost" },
  { key: "StrengthScale", value: 400, description: "Scale used in the strength-weight exponent" },
];

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
  for (const setting of defaultSettings) {
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
