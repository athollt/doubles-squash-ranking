import { prisma } from "@/lib/prisma";
import type { PlayerStore } from "@/lib/players";

// Prisma-backed PlayerStore. Name uniqueness is enforced in application code
// (case-insensitive) since the schema has no unique index on Player.name.
export const prismaPlayerStore: PlayerStore = {
  findByNameInsensitive: (name) =>
    prisma.player.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true, name: true, status: true },
    }),
  create: (name) =>
    prisma.player.create({
      data: { name },
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
