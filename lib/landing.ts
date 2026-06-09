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

// Which leagues to show on the landing page / switcher (ADR-011/012/013).
// Anyone who can't currently act on a specific league browses the FULL public
// list (public ladders are browsable); the list only narrows to a scorer's own
// leagues once they actually hold grants:
// - admin: every league (acts on all);
// - scorer WITH grants: only those leagues — the switcher view;
// - scorer with NO grants, signed-in non-staff (no role), or signed-out: every
//   league. None of them can act on one in particular, so it's a browse list,
//   not a dead end.
export function visibleLeaguesFor(
  actor: Actor,
  allLeagues: LeagueListItem[],
): LeagueListItem[] {
  if (!actor) return allLeagues;
  if (actor.role === "ADMIN") return allLeagues;
  if (actor.role === "SCORER" && actor.grants.length > 0) {
    return allLeagues.filter((l) => actor.grants.includes(l.id));
  }
  return allLeagues;
}

// Where to send a signed-in actor who lands on `/` (ADR-012/014). A non-staff
// user — signed in but neither ADMIN nor holding any scorer grant — is routed to
// the access-request bounce page; everyone else (admin, granted scorer, or a
// signed-out visitor browsing public ladders) stays on the landing (null = no
// redirect). The redirect lives only here, so it fires post-login (/ is the
// default sign-in target) without gating any other public page.
export function bounceTarget(actor: Actor): string | null {
  if (!actor) return null;
  if (actor.role === "ADMIN") return null;
  if (actor.grants.length > 0) return null;
  return "/request-access";
}
