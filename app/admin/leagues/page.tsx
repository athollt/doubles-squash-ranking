import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/page-shell";
import { LeaguesClient } from "./leagues-client";

export const metadata = {
  title: "Leagues — Rungs",
};

// Global-admin provisioning surface (ADR-012): list/create/edit leagues and
// assign existing scorers. Route-gated ADMIN-only (authorizeRoute isAdminOnly);
// re-checked here + in the server actions.
export const dynamic = "force-dynamic";

export default async function AdminLeaguesPage() {
  const session = await auth();
  if (session?.role !== "ADMIN") redirect("/unauthorised");

  const [leaguesRaw, scorers] = await Promise.all([
    prisma.league.findMany({
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        displayName: true,
        // Each league's current scorers, for the Edit dialog's scorer list.
        scorerGrants: {
          select: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { user: { name: "asc" } },
        },
        // Counts for the delete-confirmation warning (what will be destroyed).
        _count: {
          select: {
            players: true,
            sessions: true,
            ratingsLogs: true,
          },
        },
      },
    }),
    // Existing scorers (any non-admin staff) — the add dropdown picks from these;
    // new accounts are created on the Users page.
    prisma.user.findMany({
      where: { role: "SCORER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const leagues = leaguesRaw.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    displayName: l.displayName,
    scorers: l.scorerGrants.map((g) => g.user),
    counts: {
      players: l._count.players,
      sessions: l._count.sessions,
      ratings: l._count.ratingsLogs,
    },
  }));

  return (
    <PageShell title="Leagues" subtitle="Create and edit leagues, and assign scorers.">
      <LeaguesClient leagues={leagues} scorers={scorers} />
    </PageShell>
  );
}
