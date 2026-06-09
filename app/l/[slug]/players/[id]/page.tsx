import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { leagueBySlug } from "@/lib/league";
import { leaguePageTitle } from "@/lib/page-title";
import { resolveLeagueOr404 } from "@/lib/league-access";
import { prismaRecalcStore } from "@/lib/recalc-store";
import { recalculate } from "@/lib/rating-engine";
import { buildTrendPoints, buildTrendRows } from "@/lib/player-trend";
import { RatingTrendChart } from "@/components/rating-trend-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";

// Title renders the resolved league's name (step 24): "Player — {displayName}".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const league = await leagueBySlug(slug);
  if (!league) return {};
  return { title: { absolute: leaguePageTitle("Player", league.displayName) } };
}

// Public, no auth (auth-rules allows /players/*). Derived view, not cached.
export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const leagueId = (await resolveLeagueOr404(slug)).id;

  const player = await prisma.player.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, leagueId: true },
  });
  // Not found, or belongs to a different League (scoped read).
  if (!player || player.leagueId !== leagueId) notFound();

  const [settings, players, sessions, logRows] = await Promise.all([
    prismaRecalcStore.loadSettings(leagueId),
    prismaRecalcStore.loadPlayers(leagueId),
    prismaRecalcStore.loadSessions(leagueId),
    prisma.ratingsLog.findMany({
      where: { playerId: id, leagueId },
      select: {
        ratingBefore: true,
        ratingChange: true,
        ratingAfter: true,
        session: { select: { timestamp: true } },
      },
    }),
  ]);

  const { currentRatings } = recalculate({
    now: new Date(),
    settings,
    players,
    sessions,
  });
  const rating = currentRatings.get(id);

  const rows = logRows.map((r) => ({
    timestamp: r.session.timestamp,
    ratingBefore: r.ratingBefore,
    ratingChange: r.ratingChange,
    ratingAfter: r.ratingAfter,
  }));
  const points = buildTrendPoints(rows);
  const tableRows = buildTrendRows(rows);

  const sessionsPlayed = rating?.sessionsPlayed ?? 0;
  const sessionsLast90 = rating?.sessionsLast90Days ?? 0;
  const isActive = rating?.isActive ?? false;

  return (
    <PageShell
      back={{ href: `/l/${slug}`, label: "Ladder" }}
      title={
        <>
          {player.name}
          {player.status === "REMOVED" && (
            <Badge variant="muted" className="ml-2 align-middle">
              Removed
            </Badge>
          )}
        </>
      }
    >
      <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-1 text-sm">
        <div>
          <dt className="text-muted-foreground inline">Score: </dt>
          <dd className="inline font-medium tabular-nums">
            {rating ? Math.round(rating.currentRating) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground inline">Status: </dt>
          <dd className="inline font-medium">
            {isActive ? "Active" : "Inactive"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground inline">Played: </dt>
          <dd className="inline font-medium tabular-nums">
            {sessionsPlayed} ({sessionsLast90} in last 90 days)
          </dd>
        </div>
      </dl>

      {points.length === 0 ? (
        <p className="text-muted-foreground">
          No sessions played yet. A rating trend appears once {player.name} plays
          a session.
        </p>
      ) : (
        <>
          <RatingTrendChart points={points} />

          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.ratingBefore}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${
                      r.ratingChange > 0
                        ? "text-[var(--up)]"
                        : r.ratingChange < 0
                          ? "text-[var(--down)]"
                          : "text-muted-foreground"
                    }`}
                  >
                    {r.ratingChange > 0 ? "+" : ""}
                    {r.ratingChange}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.ratingAfter}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </PageShell>
  );
}
