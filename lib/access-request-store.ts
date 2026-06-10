import { prisma } from "@/lib/prisma";
import type { AccessRequestStore } from "@/lib/access-requests";

// Prisma-backed AccessRequest store (step 23, ADR-014). The pure orchestrators
// (requestAccess / approveAccessRequest / dismissAccessRequest) drive it; the
// server actions supply it and re-check the admin role.
export const prismaAccessRequestStore: AccessRequestStore = {
  leagueExists: async (id) => {
    const league = await prisma.league.findUnique({
      where: { id },
      select: { id: true },
    });
    return league !== null;
  },

  pendingExists: async (email, leagueId) => {
    const existing = await prisma.accessRequest.findFirst({
      where: {
        // A new-league request has leagueId null; match it explicitly.
        leagueId,
        status: "PENDING",
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    });
    return existing !== null;
  },

  createPending: async ({ email, name, leagueId, notes }) => {
    await prisma.accessRequest.create({
      data: { email, name, leagueId, notes },
    });
  },

  findPendingRequest: (id) =>
    prisma.accessRequest.findFirst({
      where: { id, status: "PENDING" },
      select: { id: true, email: true, name: true, leagueId: true },
    }),

  findUserByEmail: (email) =>
    prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    }),

  createScorerUser: (email, name) =>
    prisma.user.create({
      data: { email, name, role: "SCORER" },
      select: { id: true },
    }),

  grant: async (userId, leagueId) => {
    await prisma.leagueScorer.upsert({
      where: { userId_leagueId: { userId, leagueId } },
      update: {},
      create: { userId, leagueId },
    });
  },

  setStatus: async (id, status) => {
    await prisma.accessRequest.update({ where: { id }, data: { status } });
  },
};
