import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { prismaRecalcStore } from "@/lib/recalc-store";
import { recalculate, type LadderEntry, type Movement } from "@/lib/rating-engine";
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

export const metadata = {
  title: "Ladder — Doubles Squash @ BSC",
};

// Derives the live ladder on every request (ADR-002) — trivial at this scale.
export const dynamic = "force-dynamic";

function MovementIndicator({ movement }: { movement: Movement }) {
  switch (movement.direction) {
    case "up":
      return <span className="text-green-600">↑{movement.places}</span>;
    case "down":
      return <span className="text-red-600">↓{movement.places}</span>;
    case "new":
      return <span className="text-blue-600">NEW</span>;
    default:
      return <span className="text-zinc-400">—</span>;
  }
}

function StatusBadge({ entry }: { entry: LadderEntry }) {
  return (
    <>
      {!entry.isActive && (
        <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600">
          Inactive
        </span>
      )}
      {entry.isProvisional && (
        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
          (P)
        </span>
      )}
    </>
  );
}

function LadderRows({ entries }: { entries: LadderEntry[] }) {
  return (
    <>
      {entries.map((e) => (
        <TableRow key={e.playerId}>
          <TableCell className="tabular-nums">{e.rank}</TableCell>
          <TableCell>
            <Link href={`/players/${e.playerId}`} className="hover:underline">
              {e.name}
            </Link>
            <StatusBadge entry={e} />
          </TableCell>
          <TableCell className="text-right">
            <MovementIndicator movement={e.movement} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function LadderCards({ entries }: { entries: LadderEntry[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => (
        <li
          key={e.playerId}
          className="flex items-center justify-between rounded border p-3"
        >
          <span className="flex items-center">
            <span className="tabular-nums text-zinc-500">{e.rank}.</span>
            <Link href={`/players/${e.playerId}`} className="ml-2 hover:underline">
              {e.name}
            </Link>
            <StatusBadge entry={e} />
          </span>
          <MovementIndicator movement={e.movement} />
        </li>
      ))}
    </ul>
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

  const { ladder } = recalculate({
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
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">BSC Doubles Squash Ladder</h1>

      {ladder.length === 0 ? (
        <p className="text-zinc-500">
          No sessions recorded yet. The ladder appears once the first session is
          submitted.
        </p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden">
            <LadderCards entries={active} />
            {inactive.length > 0 && (
              <>
                <h2 className="mt-6 mb-2 text-sm font-medium text-zinc-500">
                  Inactive
                </h2>
                <LadderCards entries={inactive} />
              </>
            )}
          </div>

          {/* Wider screens: table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Movement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <LadderRows entries={active} />
                {inactive.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="pt-6 text-sm font-medium text-zinc-500"
                      >
                        Inactive
                      </TableCell>
                    </TableRow>
                    <LadderRows entries={inactive} />
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {lastUpdated && (
        <p className="mt-6 text-sm text-zinc-400">
          Last updated: {lastUpdated.toISOString().slice(0, 10)}
        </p>
      )}
    </main>
  );
}
