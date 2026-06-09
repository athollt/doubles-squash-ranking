import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/page-shell";
import { LeaguesClient } from "./leagues-client";

export const metadata = {
  title: "Leagues — Rungs",
};

// Global-admin provisioning surface (ADR-012): create a league, assign a scorer.
// Route-gated ADMIN-only (authorizeRoute isAdminOnly); re-checked here + in the
// server actions.
export const dynamic = "force-dynamic";

export default async function AdminLeaguesPage() {
  const session = await auth();
  if (session?.role !== "ADMIN") redirect("/unauthorised");

  const leagues = await prisma.league.findMany({
    orderBy: { displayName: "asc" },
    select: { id: true, slug: true, displayName: true },
  });

  return (
    <PageShell title="Leagues" subtitle="Create a league and assign its scorers.">
      <LeaguesClient leagues={leagues} />
    </PageShell>
  );
}
