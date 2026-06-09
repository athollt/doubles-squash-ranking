import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type Role } from "@/lib/nav";
import { bounceTarget, type Actor } from "@/lib/landing";
import { prismaLeagueScorerStore } from "@/lib/league-scorer-store";
import { PageShell } from "@/components/ui/page-shell";
import { RequestAccessForm } from "./request-access-form";

export const metadata = {
  title: "Request access",
};

// The non-staff bounce page (ADR-012/014, stories #17/#18): a signed-in user who
// is neither an admin nor a granted scorer lands here. It explains that sign-in
// is for scorers and admins, and offers a "Request scorer access" action for a
// chosen league. Staff who reach it (already have access) are sent home.
export const dynamic = "force-dynamic";

export default async function RequestAccessPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");

  const role = session.role as Role | undefined;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  const grants = user
    ? await prismaLeagueScorerStore.leagueIdsFor(user.id)
    : [];
  const actor: Actor = { role, grants };
  // Already staff (admin or a granted scorer) → they have access, send home.
  if (bounceTarget(actor) === null) redirect("/");

  const leagues = await prisma.league.findMany({
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });

  return (
    <PageShell
      title="Scorers & admins only"
      subtitle="This sign-in is for the people who score and manage leagues."
    >
      <p className="text-muted-foreground mb-6 text-sm">
        You&rsquo;re signed in, but your account hasn&rsquo;t been given scoring
        access to any league yet. If you help run a league — or want to set one up
        — request access below and an admin will review it. You can still browse
        any league&rsquo;s public ladder without signing in.
      </p>
      <RequestAccessForm leagues={leagues} />
    </PageShell>
  );
}
