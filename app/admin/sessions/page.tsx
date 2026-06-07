import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = {
  title: "Sessions — Doubles Squash @ BSC",
};

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { timestamp: "desc" },
    select: {
      id: true,
      timestamp: true,
      totalPlayerWins: true,
      playerCount: true,
      submittedBy: { select: { name: true, email: true } },
    },
  });

  return (
    <PageShell title="Sessions">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Submitter</TableHead>
            <TableHead>Players</TableHead>
            <TableHead>Total wins</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                No sessions yet.
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.timestamp.toISOString().slice(0, 10)}</TableCell>
                <TableCell>{s.submittedBy.name}</TableCell>
                <TableCell>{s.playerCount}</TableCell>
                <TableCell>{s.totalPlayerWins}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/sessions/${s.id}/edit`}
                    className={buttonVariants({ variant: "default", size: "sm" })}
                  >
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </PageShell>
  );
}
