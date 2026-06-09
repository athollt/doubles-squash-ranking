import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leagueBySlug, type LeagueContext } from "@/lib/league";
import { prismaLeagueScorerStore } from "@/lib/league-scorer-store";
import { canScoreLeague } from "@/lib/auth-rules";

// Page-boundary access helpers for /l/{slug} routes (step 21, ADR-013). The
// proxy gates on route shape only; these resolve the real league and enforce the
// per-league grant where the league id is known.

// Resolve a slug to its league, or 404. Used by every league page (public reads
// included — an unknown slug is not a league).
export async function resolveLeagueOr404(slug: string): Promise<LeagueContext> {
  const league = await leagueBySlug(slug);
  if (!league) notFound();
  return league;
}

export type LeagueScorerContext = {
  league: LeagueContext;
  userId: string;
  role: "ADMIN" | "SCORER" | undefined;
};

// Resolve the league and require the signed-in staff member to be able to score
// it (ADR-012): admin bypasses, a scorer needs a LeagueScorer grant. Unknown
// slug → 404; logged out → /signin; logged in without grant → /unauthorised.
// Used by the league scorer/admin pages (submit, edit, admin/*).
export async function requireLeagueScorer(
  slug: string,
): Promise<LeagueScorerContext> {
  const league = await resolveLeagueOr404(slug);

  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) redirect("/signin");

  const grants = await prismaLeagueScorerStore.leagueIdsFor(user.id);
  if (!canScoreLeague({ role: session.role, grants, leagueId: league.id })) {
    redirect("/unauthorised");
  }

  return { league, userId: user.id, role: session.role };
}
