// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { prismaRecalcStore } from "./recalc-store";

// Schema-only tenancy round-trip (step 18). Proves the generated client exposes
// the League model and the nullable leagueId relation; no application code reads
// leagueId yet. Cleans up its own rows so it is safe to re-run.
describe("League tenancy schema", () => {
  const createdUserIds: string[] = [];
  const createdSessionIds: string[] = [];
  const createdPlayerIds: string[] = [];
  const createdLeagueIds: string[] = [];

  afterEach(async () => {
    if (createdSessionIds.length) {
      await prisma.session.deleteMany({
        where: { id: { in: createdSessionIds } },
      });
      createdSessionIds.length = 0;
    }
    if (createdPlayerIds.length) {
      await prisma.player.deleteMany({ where: { id: { in: createdPlayerIds } } });
      createdPlayerIds.length = 0;
    }
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      createdUserIds.length = 0;
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

  // Behaviour 4 (step 19): the public read paths are league-scoped. The recalc
  // store backs the ladder/trend reads; here we prove at the real-DB query seam
  // that a scoped load returns ONLY the requested League's rows, with two
  // Leagues' sessions present at once.
  it("loads only the requested League's sessions (cross-league isolation)", async () => {
    const submitter = await prisma.user.create({
      data: { email: "tenancy-test@example.com", name: "T", role: "SCORER" },
    });
    createdUserIds.push(submitter.id);

    const mk = async (slug: string) => {
      const league = await prisma.league.create({
        data: { name: slug, displayName: slug, slug },
      });
      createdLeagueIds.push(league.id);
      const player = await prisma.player.create({
        data: { name: `${slug}-player`, leagueId: league.id },
      });
      createdPlayerIds.push(player.id);
      const session = await prisma.session.create({
        data: {
          timestamp: new Date("2026-01-01T00:00:00Z"),
          submittedById: submitter.id,
          leagueId: league.id,
          totalPlayerWins: 2,
          inferredGames: 1,
          playerCount: 1,
          sessionPlayers: { create: [{ playerId: player.id, wins: 2 }] },
        },
      });
      createdSessionIds.push(session.id);
      return { leagueId: league.id, sessionId: session.id };
    };

    const a = await mk("tenancy-isolation-a");
    const b = await mk("tenancy-isolation-b");

    const aSessions = await prismaRecalcStore.loadSessions(a.leagueId);
    const bSessions = await prismaRecalcStore.loadSessions(b.leagueId);

    expect(aSessions.map((s) => s.id)).toEqual([a.sessionId]);
    expect(bSessions.map((s) => s.id)).toEqual([b.sessionId]);
  });
});
