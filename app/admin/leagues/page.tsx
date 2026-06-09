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

  const [leagues, scorers] = await Promise.all([
    prisma.league.findMany({
      orderBy: { displayName: "asc" },
      select: { id: true, name: true, slug: true, displayName: true },
    }),
    // Existing scorers (any non-admin staff) — the assign dropdown picks from
    // these; new accounts are created on the Users page.
    prisma.user.findMany({
      where: { role: "SCORER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <PageShell title="Leagues" subtitle="Create and edit leagues, and assign scorers.">
      <LeaguesClient leagues={leagues} scorers={scorers} />
    </PageShell>
  );
}
