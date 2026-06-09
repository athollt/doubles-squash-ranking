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

  it("adopted the original BSC data into the seed League", async () => {
    const league = await prisma.league.findUniqueOrThrow({
      where: { slug: "bsc-doubles-squash" },
    });

    // The original BSC data is owned by the seed League. Asserted against the
    // BSC League's own counts (not the global totals) so concurrent DB-backed
    // tests creating their own ephemeral leagues/rows don't perturb this — the
    // adoption invariant is "the BSC rows belong to the BSC league", and the
    // schema's NOT NULL + FK make true orphans structurally impossible.
    const scoped = await Promise.all([
      prisma.player.count({ where: { leagueId: league.id } }),
      prisma.session.count({ where: { leagueId: league.id } }),
      prisma.setting.count({ where: { leagueId: league.id } }),
      prisma.ratingsLog.count({ where: { leagueId: league.id } }),
      prisma.ladderSnapshot.count({ where: { leagueId: league.id } }),
    ]);

    // Players ≥ 10 (the seeded roster); settings exactly the 15 rating params;
    // sessions/logs/snapshots present. Lower bounds keep this stable as the dev
    // DB accrues sessions over time.
    expect(scoped[0]).toBeGreaterThanOrEqual(10); // players
    expect(scoped[1]).toBeGreaterThan(0); // sessions
    expect(scoped[2]).toBe(15); // settings (the rating params)
    expect(scoped[3]).toBeGreaterThan(0); // ratings-log
    expect(scoped[4]).toBeGreaterThan(0); // snapshots
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
