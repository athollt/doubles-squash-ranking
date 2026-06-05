import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./users-client";

export const metadata = {
  title: "Users — Doubles Squash @ BSC",
};

// User data is live and admin-only; never prerender or cache at build time.
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  const self = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })
    : null;

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    created: u.createdAt.toISOString().slice(0, 10),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>
      <UsersClient
        users={rows}
        selfId={self?.id ?? null}
        adminCount={adminCount}
      />
    </main>
  );
}
