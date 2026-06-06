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
import { PageShell } from "@/components/ui/page-shell";

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
    <PageShell
      back={{ href: "/sessions", label: "Session history" }}
      title={formatSessionDate(session.timestamp)}
      subtitle={`Submitted by ${session.submittedBy.name}`}
    >
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

      <p className="text-muted-foreground mt-4 text-sm">
        {session.totalPlayerWins} total wins · {session.inferredGames} games played
      </p>

      {session.notes && (
        <div className="mt-6">
          <h2 className="text-muted-foreground mb-1 text-sm font-medium">Notes</h2>
          <p className="whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}
    </PageShell>
  );
}
