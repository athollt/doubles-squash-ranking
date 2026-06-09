// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";

afterAll(async () => {
  await prisma.$disconnect();
});

// Adoption migration invariant (step 19, ADR-015): after migration the seed BSC
// League exists and every domain row belongs to a League (leagueId NOT NULL,
// enforced by the schema). Runs against the migrated dev DB.
describe("BSC adoption migration", () => {
  it("created the seed BSC Doubles Squash League with its slug", async () => {
    const league = await prisma.league.findUnique({
      where: { slug: "bsc-doubles-squash" },
    });
    expect(league?.name).toBe("BSC Doubles Squash");
    expect(league?.displayName).toBe("Doubles Squash @ BSC");
  });

  it("adopted every domain row into a League (no orphans)", async () => {
    const league = await prisma.league.findUniqueOrThrow({
      where: { slug: "bsc-doubles-squash" },
    });

    // Every row's leagueId equals the BSC League — i.e. nothing belongs to any
    // other League and nothing is unscoped. (leagueId is NOT NULL in the schema,
    // so "belongs to a League" reduces to "belongs to *this* League" here.)
    const [players, sessions, settings, logs, snapshots] = await Promise.all([
      prisma.player.count(),
      prisma.session.count(),
      prisma.setting.count(),
      prisma.ratingsLog.count(),
      prisma.ladderSnapshot.count(),
    ]);
    const scoped = await Promise.all([
      prisma.player.count({ where: { leagueId: league.id } }),
      prisma.session.count({ where: { leagueId: league.id } }),
      prisma.setting.count({ where: { leagueId: league.id } }),
      prisma.ratingsLog.count({ where: { leagueId: league.id } }),
      prisma.ladderSnapshot.count({ where: { leagueId: league.id } }),
    ]);

    expect(scoped).toEqual([players, sessions, settings, logs, snapshots]);
  });

  it("split the settings into the League (unique on leagueId+key)", async () => {
    const league = await prisma.league.findUniqueOrThrow({
      where: { slug: "bsc-doubles-squash" },
    });
    const settings = await prisma.setting.findMany({
      where: { leagueId: league.id },
    });
    // Keys are unique within the League.
    const keys = settings.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    // The rating params survived the split (StartingRating still present).
    expect(settings.some((s) => s.key === "StartingRating")).toBe(true);
  });
});
