import { prisma } from "@/lib/prisma";
import { PlayersClient } from "./players-client";

export const metadata = {
  title: "Players — Doubles Squash @ BSC",
};

// Player data is live and admin-only; never prerender or cache at build time.
export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true, createdAt: true },
  });

  const rows = players.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    created: p.createdAt.toISOString().slice(0, 10),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Players</h1>
      <PlayersClient players={rows} />
    </main>
  );
}
