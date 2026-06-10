// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { prismaLeagueScorerStore } from "./league-scorer-store";

// LeagueScorer grant store round-trip (ADR-012). Creates its own ephemeral
// user + league, grants/reads/revokes, and cleans up.
describe("LeagueScorer grant store", () => {
  const leagueIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await prisma.leagueScorer.deleteMany({
      where: { userId: { in: userIds } },
    });
    if (leagueIds.length) {
      await prisma.league.deleteMany({ where: { id: { in: leagueIds } } });
      leagueIds.length = 0;
    }
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      userIds.length = 0;
    }
    await prisma.$disconnect();
  });

  async function freshUserAndLeague() {
    const user = await prisma.user.create({
      data: { email: "grant-test@example.com", name: "Grant", role: "SCORER" },
    });
    userIds.push(user.id);
    const league = await prisma.league.create({
      data: { name: "Grant L", displayName: "Grant L", slug: "grant-test-league" },
    });
    leagueIds.push(league.id);
    return { userId: user.id, leagueId: league.id };
  }

  it("grants a league, lists it, and revokes it", async () => {
    const { userId, leagueId } = await freshUserAndLeague();

    await prismaLeagueScorerStore.grant(userId, leagueId);
    expect(await prismaLeagueScorerStore.leagueIdsFor(userId)).toEqual([leagueId]);

    await prismaLeagueScorerStore.revoke(userId, leagueId);
    expect(await prismaLeagueScorerStore.leagueIdsFor(userId)).toEqual([]);
  });

  it("grant is idempotent on (userId, leagueId)", async () => {
    const { userId, leagueId } = await freshUserAndLeague();

    await prismaLeagueScorerStore.grant(userId, leagueId);
    await prismaLeagueScorerStore.grant(userId, leagueId);

    expect(await prismaLeagueScorerStore.leagueIdsFor(userId)).toEqual([leagueId]);
  });
});
