import { prisma } from "@/lib/prisma";

// Transitional single-League resolver (step 19). Retained for the few remaining
// non-slug callers; league pages now resolve by slug (leagueBySlug, step 21).
export async function getDefaultLeagueId(): Promise<string> {
  const league = await prisma.league.findFirstOrThrow({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return league.id;
}

export type LeagueContext = {
  id: string;
  slug: string;
  name: string;
  displayName: string;
};

// Resolve a /l/{slug} route's league. Returns null for an unknown slug so the
// page boundary can 404 (ADR-013). Read by every league-scoped page.
export async function leagueBySlug(slug: string): Promise<LeagueContext | null> {
  return prisma.league.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, displayName: true },
  });
}
