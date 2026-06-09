// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";

// Schema-only tenancy round-trip (step 18). Proves the generated client exposes
// the League model and the nullable leagueId relation; no application code reads
// leagueId yet. Cleans up its own rows so it is safe to re-run.
describe("League tenancy schema", () => {
  const createdPlayerIds: string[] = [];
  const createdLeagueIds: string[] = [];

  afterEach(async () => {
    if (createdPlayerIds.length) {
      await prisma.player.deleteMany({ where: { id: { in: createdPlayerIds } } });
      createdPlayerIds.length = 0;
    }
    if (createdLeagueIds.length) {
      await prisma.league.deleteMany({ where: { id: { in: createdLeagueIds } } });
      createdLeagueIds.length = 0;
    }
    await prisma.$disconnect();
  });

  it("round-trips a Player attached to a League via leagueId", async () => {
    const league = await prisma.league.create({
      data: {
        name: "Tenancy Test League",
        displayName: "Tenancy Test League",
        slug: "tenancy-test-league-step18",
      },
    });
    createdLeagueIds.push(league.id);

    const player = await prisma.player.create({
      data: { name: "Tenancy Test Player", leagueId: league.id },
    });
    createdPlayerIds.push(player.id);

    const fetched = await prisma.player.findUnique({
      where: { id: player.id },
      include: { league: true },
    });

    expect(fetched?.leagueId).toBe(league.id);
    expect(fetched?.league?.slug).toBe("tenancy-test-league-step18");
  });
});
