import type { Role } from "@/lib/nav";

// One league row on the landing page / switcher.
export type LeagueListItem = {
  id: string;
  slug: string;
  displayName: string;
};

// The signed-in actor (null = signed out). Grants are the league ids a scorer
// holds (LeagueScorer); ignored for an admin.
export type Actor = { role: Role | undefined; grants: string[] } | null;

// Which leagues to show on the landing page / switcher (ADR-011/012):
// - admin: every league (acts on all);
// - scorer: only the leagues they are granted;
// - signed out: every league (public ladders are browsable, ADR-013).
export function visibleLeaguesFor(
  actor: Actor,
  allLeagues: LeagueListItem[],
): LeagueListItem[] {
  if (!actor) return allLeagues;
  if (actor.role === "ADMIN") return allLeagues;
  return allLeagues.filter((l) => actor.grants.includes(l.id));
}
