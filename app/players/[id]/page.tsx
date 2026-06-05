import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

export const metadata = {
  title: "Player — Doubles Squash @ BSC",
};

// Public, no auth (auth-rules allows /players/*). Derived view, not cached.
export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });
  if (!player) notFound();

  const [settings, players, sessions, logRows] = await Promise.all([
    prismaRecalcStore.loadSettings(),
    prismaRecalcStore.loadPlayers(),
    prismaRecalcStore.loadSessions(),
    prisma.ratingsLog.findMany({
      where: { playerId: id },
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
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Ladder
      </Link>

      <h1 className="mt-2 mb-1 text-2xl font-semibold">
        {player.name}
        {player.status === "REMOVED" && (
          <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600">
            Removed
          </span>
        )}
      </h1>

      <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-1 text-sm">
        <div>
          <dt className="inline text-zinc-500">Current rating: </dt>
          <dd className="inline font-medium tabular-nums">
            {rating ? Math.round(rating.currentRating) : "—"}
          </dd>
        </div>
        <div>
          <dt className="inline text-zinc-500">Status: </dt>
          <dd className="inline font-medium">
            {isActive ? "Active" : "Inactive"}
          </dd>
        </div>
        <div>
          <dt className="inline text-zinc-500">Sessions played: </dt>
          <dd className="inline font-medium tabular-nums">
            {sessionsPlayed} ({sessionsLast90} in last 90 days)
          </dd>
        </div>
      </dl>

      {points.length === 0 ? (
        <p className="text-zinc-500">
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
                        ? "text-green-600"
                        : r.ratingChange < 0
                          ? "text-red-600"
                          : "text-zinc-400"
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
    </main>
  );
}
