import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type Role } from "@/lib/nav";
import { visibleLeaguesFor, type Actor } from "@/lib/landing";
import { prismaLeagueScorerStore } from "@/lib/league-scorer-store";
import { PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Rungs — club ladders, ranked",
};

// The Rungs landing + league switcher (step 22): one list whose contents vary by
// viewer — an admin sees every league, a scorer their granted ones, a signed-out
// visitor every (public) ladder to browse. Each row links to /l/{slug}.
export const dynamic = "force-dynamic";

export default async function Landing() {
  const session = await auth();
  const role = session?.role as Role | undefined;

  // The acting user's grants (scorer authority). Resolve the user id from the
  // session email; admins don't need grants (they see all).
  let actor: Actor = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    const grants = user
      ? await prismaLeagueScorerStore.leagueIdsFor(user.id)
      : [];
    actor = { role, grants };
  }

  const allLeagues = await prisma.league.findMany({
    orderBy: { displayName: "asc" },
    select: { id: true, slug: true, displayName: true },
  });
  const leagues = visibleLeaguesFor(actor, allLeagues);
  const isAdmin = role === "ADMIN";

  return (
    <PageShell
      title="Rungs"
      subtitle="Individual ladders for doubles play — squash, padel, tennis, pickleball and more."
    >
      <p className="text-muted-foreground mb-6 text-sm">
        Players partner up differently each session; Rungs rates each person, not the
        pair. All you record is how many games each player won in a session — Rungs
        turns that into a live ranking ladder. Pick a ladder below to see its standings.
      </p>

      {leagues.length === 0 ? (
        <p className="text-muted-foreground">
          {actor && !isAdmin
            ? "You have not been assigned to a league yet. Ask an admin for access."
            : "No leagues yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {leagues.map((l) => (
            <li key={l.id}>
              <Link href={`/l/${l.slug}`} className="block">
                <Card className="hover:border-primary p-4 transition-colors">
                  <span className="font-heading text-lg font-bold">
                    {l.displayName}
                  </span>
                  <span aria-hidden className="text-primary ml-1">
                    ›
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
