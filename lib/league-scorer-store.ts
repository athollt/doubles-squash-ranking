import { prisma } from "@/lib/prisma";

// Persistence port for LeagueScorer grants (ADR-012). Pure callers (authz) take
// the leagueId list; this is where it comes from for staff actions/pages.
export interface LeagueScorerStore {
  // Ids of the leagues a user is granted (their scorer authority).
  leagueIdsFor(userId: string): Promise<string[]>;
  // Grant a league to a user; idempotent on (userId, leagueId).
  grant(userId: string, leagueId: string): Promise<void>;
  // Revoke a user's grant for a league (no-op if absent).
  revoke(userId: string, leagueId: string): Promise<void>;
}

export const prismaLeagueScorerStore: LeagueScorerStore = {
  leagueIdsFor: async (userId) => {
    const rows = await prisma.leagueScorer.findMany({
      where: { userId },
      select: { leagueId: true },
    });
    return rows.map((r) => r.leagueId);
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
