import { prisma } from "@/lib/prisma";
import { requireLeagueScorer } from "@/lib/league-access";
import { PageShell } from "@/components/ui/page-shell";
import { PlayersClient } from "./players-client";

export const metadata = {
  title: "Players — Doubles Squash @ BSC",
};

// Player data is live and staff-only; never prerender or cache at build time.
export const dynamic = "force-dynamic";

export default async function AdminPlayersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { league } = await requireLeagueScorer(slug);

  const players = await prisma.player.findMany({
    where: { leagueId: league.id },
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
    <PageShell title="Players">
      <PlayersClient players={rows} slug={slug} />
    </PageShell>
  );
}
