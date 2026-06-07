import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { prismaRecalcStore } from "@/lib/recalc-store";
import { recalculate, type LadderEntry, type PlayerRating } from "@/lib/rating-engine";
import {
  lastUpdatedFrom,
  previousRankingsFromSnapshot,
} from "@/lib/public-ladder";
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
import { Trend } from "@/components/ui/trend";

export const metadata = {
  title: "Ladder — Doubles Squash @ BSC",
};

// Derives the live ladder on every request (ADR-002) — trivial at this scale.
export const dynamic = "force-dynamic";

// One ladder row. `Score` = rounded ladderScore (the ranked number); `Played` =
// sessions in the last 90 days; `Trend` = rank change. Terms per CONTEXT-redesign.md.
function LadderRows({
  entries,
  ratings,
}: {
  entries: LadderEntry[];
  ratings: Map<string, PlayerRating>;
}) {
  return (
    <>
      {entries.map((e) => (
        <TableRow key={e.playerId}>
          <TableCell className="text-primary font-heading font-black tabular-nums">
            {e.rank}
          </TableCell>
          <TableCell>
            {/* Link-coloured name + chevron — a tap affordance for the trend page
                (hover underline isn't visible on mobile). */}
            <Link
              href={`/players/${e.playerId}`}
              className="text-primary font-medium hover:underline"
            >
              {e.name}
              <span aria-hidden className="ml-0.5">
                ›
              </span>
            </Link>
            {e.isProvisional && (
              <Badge variant="new" className="ml-2">
                New
              </Badge>
            )}
          </TableCell>
          {/* Score is dropped on very narrow screens so Trend isn't clipped. */}
          <TableCell className="hidden text-right font-heading font-bold tabular-nums sm:table-cell">
            {Math.round(e.ladderScore)}
          </TableCell>
          <TableCell className="text-center tabular-nums">
            {ratings.get(e.playerId)?.sessionsLast90Days ?? 0}
          </TableCell>
          <TableCell className="text-right">
            <Trend movement={e.movement} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default async function Home() {
  const [settings, players, sessions, recentSnapshots] = await Promise.all([
    prismaRecalcStore.loadSettings(),
    prismaRecalcStore.loadPlayers(),
    prismaRecalcStore.loadSessions(),
    // The latest snapshot reflects the current state; movement is measured
    // against the one before it (the previous state) — see step 09 decision.
    prisma.ladderSnapshot.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { rankings: true },
    }),
  ]);

  const previousSnapshot = recentSnapshots[1];
  const previousRankings = previousSnapshot
    ? previousRankingsFromSnapshot(
        previousSnapshot.rankings as Array<{ playerId: string; rank: number }>,
      )
    : undefined;

  const { ladder, currentRatings } = recalculate({
    now: new Date(),
    settings,
    players,
    sessions,
    previousRankings,
  });

  const active = ladder.filter((e) => e.isActive);
  const inactive = ladder.filter((e) => !e.isActive);
  const lastUpdated = lastUpdatedFrom(sessions);

  return (
    <PageShell title="Ladder">
      {ladder.length === 0 ? (
        <p className="text-muted-foreground">
          No sessions recorded yet. The ladder appears once the first session is
          submitted.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Score</TableHead>
              <TableHead className="text-center">Played</TableHead>
              <TableHead className="text-right">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <LadderRows entries={active} ratings={currentRatings} />
            {inactive.length > 0 && (
              <>
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground pt-6 text-sm font-medium"
                  >
                    Inactive
                  </TableCell>
                </TableRow>
                <LadderRows entries={inactive} ratings={currentRatings} />
              </>
            )}
          </TableBody>
        </Table>
      )}

      {lastUpdated && (
        <p className="text-muted-foreground mt-6 text-sm">
          Last updated: {lastUpdated.toISOString().slice(0, 10)}
        </p>
      )}

      <p className="text-muted-foreground mt-2 text-xs">
        “Score” ranks the ladder · “Played” = sessions in the last 90 days
      </p>
    </PageShell>
  );
}
