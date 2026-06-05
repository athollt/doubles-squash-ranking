import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

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
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  await prisma.user.upsert({
    where: { email: "atholl@tomlinson.co.za" },
    update: {},
    create: {
      email: "atholl@tomlinson.co.za",
      name: "Atholl",
      role: "ADMIN",
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
