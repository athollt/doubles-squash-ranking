import { prisma } from "@/lib/prisma";
import type { RecalcStore } from "@/lib/recalc";

// Prisma-backed RecalcStore. Used by the settings/session server actions.
// League-scoped (ADR-011): every query filters by leagueId, and written
// RatingsLog/snapshot rows carry it.
export const prismaRecalcStore: RecalcStore = {
  loadSettings: async (leagueId) => {
    const rows = await prisma.setting.findMany({
      where: { leagueId },
      select: { key: true, value: true },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  loadPlayers: async (leagueId) => {
    const rows = await prisma.player.findMany({
      where: { leagueId },
      select: { id: true, name: true, status: true },
    });
    return rows.map((r) => ({ id: r.id, name: r.name, status: r.status }));
  },

  loadSessions: async (leagueId) => {
    const rows = await prisma.session.findMany({
      where: { leagueId },
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

  replaceRatingsLog: async (leagueId, entries) => {
    await prisma.$transaction([
      prisma.ratingsLog.deleteMany({ where: { leagueId } }),
      prisma.ratingsLog.createMany({
        data: entries.map((e) => ({ ...e, leagueId })),
      }),
    ]);
  },

  createLadderSnapshot: async (leagueId, ladder) => {
    await prisma.ladderSnapshot.create({ data: { rankings: ladder, leagueId } });
  },
};
