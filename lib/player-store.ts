import { prisma } from "@/lib/prisma";
import type { PlayerStore } from "@/lib/players";

// Prisma-backed PlayerStore, scoped to one League (ADR-011). Name lookup +
// creation are filtered/stamped by leagueId, so dedup is per-League and new
// players carry the required leagueId. Rename/status operate by id (unchanged).
// Built per request from the resolved League — step 21 resolves it from the route.
export function makePrismaPlayerStore(leagueId: string): PlayerStore {
  return {
    findByNameInsensitive: (name) =>
      prisma.player.findFirst({
        where: { leagueId, name: { equals: name, mode: "insensitive" } },
        select: { id: true, name: true, status: true },
      }),
    create: (name) =>
      prisma.player.create({
        data: { name, leagueId },
        select: { id: true, name: true, status: true },
      }),
    updateName: (id, name) =>
      prisma.player.update({
        where: { id },
        data: { name },
        select: { id: true, name: true, status: true },
      }),
    updateStatus: (id, status) =>
      prisma.player.update({
        where: { id },
        data: { status },
        select: { id: true, name: true, status: true },
      }),
  };
}
