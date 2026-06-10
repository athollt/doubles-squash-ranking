import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { leagueBySlug } from "@/lib/league";
import { leaguePageTitle } from "@/lib/page-title";
import { requireLeagueScorer } from "@/lib/league-access";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

// Title leads with the brand, then the league (step 24): "Rungs - {displayName}".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const league = await leagueBySlug(slug);
  if (!league) return {};
  return { title: { absolute: leaguePageTitle(league.displayName) } };
}

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { league } = await requireLeagueScorer(slug);
  const sessions = await prisma.session.findMany({
    where: { leagueId: league.id },
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
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Submitter</TableHead>
              <TableHead>Players</TableHead>
              <TableHead>Wins</TableHead>
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
                      href={`/l/${slug}/sessions/${s.id}/edit`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </PageShell>
  );
}
