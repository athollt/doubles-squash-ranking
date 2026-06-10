import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS } from "@/lib/default-settings";
import type { LeagueProvisioningStore } from "@/lib/league-provisioning";

// Prisma-backed provisioning store (step 22). Scorers are granted from existing
// Users (the Users page creates accounts); a scorer's power is the grant (ADR-012).
export const prismaLeagueProvisioningStore: LeagueProvisioningStore = {
  slugTaken: async (slug) => {
    const existing = await prisma.league.findUnique({
      where: { slug },
      select: { id: true },
    });
    return existing !== null;
  },

  createLeagueWithSettings: async ({ name, displayName, slug }) => {
    return prisma.$transaction(async (tx) => {
      const league = await tx.league.create({
        data: { name, displayName, slug },
        select: { id: true, slug: true, displayName: true },
      });
      await tx.setting.createMany({
        data: DEFAULT_SETTINGS.map((s) => ({ ...s, leagueId: league.id })),
      });
      return league;
    });
  },

  updateLeagueDetails: (id, { name, displayName }) =>
    prisma.league.update({
      where: { id },
      data: { name, displayName },
      select: { id: true, slug: true, displayName: true },
    }),

  // Delete a league and all its data. The leagueId FKs are onDelete: Restrict
  // (step 19) — a tenant must not be silently nulled out — so children are
  // removed explicitly, in dependency order, inside one transaction:
  //   snapshots → ratingsLogs → sessions (cascades any SessionPlayer/RatingsLog)
  //   → settings → players → league (LeagueScorer grants cascade with it).
  deleteLeagueWithData: async (id) => {
    await prisma.$transaction([
      prisma.ladderSnapshot.deleteMany({ where: { leagueId: id } }),
      prisma.ratingsLog.deleteMany({ where: { leagueId: id } }),
      prisma.session.deleteMany({ where: { leagueId: id } }),
      prisma.setting.deleteMany({ where: { leagueId: id } }),
      prisma.player.deleteMany({ where: { leagueId: id } }),
      prisma.league.delete({ where: { id } }),
    ]);
  },

  grant: async (userId, leagueId) => {
    await prisma.leagueScorer.upsert({
      where: { userId_leagueId: { userId, leagueId } },
      update: {},
      create: { userId, leagueId },
    });
  },

  revoke: async (userId, leagueId) => {
    await prisma.leagueScorer.deleteMany({ where: { userId, leagueId } });
  },
};
