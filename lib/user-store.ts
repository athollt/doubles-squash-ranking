import { prisma } from "@/lib/prisma";
import type { UserStore } from "@/lib/users";

// Prisma-backed UserStore. Email uniqueness is also enforced by the DB unique
// index on User.email; the case-insensitive check here gives a friendly error.
export const prismaUserStore: UserStore = {
  findByEmailInsensitive: (email) =>
    prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, name: true, role: true },
    }),
  findById: (id) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    }),
  countAdmins: () => prisma.user.count({ where: { role: "ADMIN" } }),
  create: (email, name, role) =>
    prisma.user.create({
      data: { email, name, role },
      select: { id: true, email: true, name: true, role: true },
    }),
  updateRole: (id, role) =>
    prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    }),
  updateName: (id, name) =>
    prisma.user.update({
      where: { id },
      data: { name },
      select: { id: true, email: true, name: true, role: true },
    }),
  delete: async (id) => {
    await prisma.user.delete({ where: { id } });
  },
};
