import { prisma } from "@/lib/prisma";
import type { RecalcStore } from "@/lib/recalc";

// Prisma-backed RecalcStore. Used by the settings/session server actions.
export const prismaRecalcStore: RecalcStore = {
  loadSettings: async () => {
    const rows = await prisma.setting.findMany({
      select: { key: true, value: true },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  loadPlayers: async () => {
    const rows = await prisma.player.findMany({
      select: { id: true, name: true, status: true },
    });
    return rows.map((r) => ({ id: r.id, name: r.name, status: r.status }));
  },

  loadSessions: async () => {
    const rows = await prisma.session.findMany({
      orderBy: { timestamp: "asc" },
      select: {
        id: true,
        timestamp: true,
        sessionPlayers: { select: { playerId: true, wins: true } },
      },
    });
    return rows.map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      players: s.sessionPlayers.map((p) => ({
        playerId: p.playerId,
        wins: p.wins,
      })),
    }));
  },

  replaceRatingsLog: async (entries) => {
    await prisma.$transaction([
      prisma.ratingsLog.deleteMany({}),
      prisma.ratingsLog.createMany({ data: entries }),
    ]);
  },

  createLadderSnapshot: async (ladder) => {
    await prisma.ladderSnapshot.create({ data: { rankings: ladder } });
  },
};
