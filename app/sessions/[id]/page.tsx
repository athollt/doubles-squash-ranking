import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatSessionDate } from "@/lib/session-history";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Session — Doubles Squash @ BSC",
};

// Public, no auth (auth-rules allows /sessions/<id>). Derived view, not cached.
export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      timestamp: true,
      notes: true,
      totalPlayerWins: true,
      inferredGames: true,
      submittedBy: { select: { name: true } },
      sessionPlayers: {
        orderBy: { wins: "desc" },
        select: { wins: true, player: { select: { name: true } } },
      },
    },
  });

  if (!session) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <Link href="/sessions" className="text-sm text-blue-600 hover:underline">
        ← Session history
      </Link>

      <h1 className="mt-2 mb-1 text-2xl font-semibold">
        {formatSessionDate(session.timestamp)}
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Submitted by {session.submittedBy.name}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Wins</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {session.sessionPlayers.map((sp, i) => (
            <TableRow key={i}>
              <TableCell>{sp.player.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {sp.wins}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="mt-4 text-sm text-zinc-500">
        {session.totalPlayerWins} total player-wins · {session.inferredGames}{" "}
        games
      </p>

      {session.notes && (
        <div className="mt-6">
          <h2 className="mb-1 text-sm font-medium text-zinc-500">Notes</h2>
          <p className="whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}
    </main>
  );
}
