export type RouteDecision = "allow" | "signin" | "unauthorised";

export interface RouteAuth {
  role?: string;
  // Ids of the leagues this scorer is granted (LeagueScorer). Empty/absent for a
  // scorer with no grants; ignored for an admin (who bypasses). ADR-012.
  grants?: string[];
}

// Whether a staff member may score (log/edit sessions in) a given league.
// A global ADMIN bypasses; a SCORER needs a LeagueScorer grant for that league
// (ADR-012). Pure — the grant list is supplied by the caller.
export function canScoreLeague({
  role,
  grants,
  leagueId,
}: {
  role: string | undefined;
  grants: string[];
  leagueId: string;
}): boolean {
  if (role === "ADMIN") return true;
  return grants.includes(leagueId);
}

// A session detail page is /sessions/<id> — exactly one segment after
// /sessions/. /sessions/<id>/edit is a scorer route, so it is not public.
function isPublicSessionDetail(pathname: string): boolean {
  const match = pathname.match(/^\/sessions\/([^/]+)$/);
  return match !== null;
}

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/unauthorised" ||
    pathname === "/signin" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/sessions" ||
    isPublicSessionDetail(pathname) ||
    pathname.startsWith("/players/")
  );
}

// Admin screens a non-admin (scorer) may NOT reach. Players, Sessions and
// Settings are open to any signed-in user (step 16.x); Users — which manages
// login accounts and roles — stays ADMIN-only.
function isAdminOnly(pathname: string): boolean {
  return pathname === "/admin/users" || pathname.startsWith("/admin/users/");
}

export function authorizeRoute(
  pathname: string,
  auth: RouteAuth | null,
  targetLeagueId?: string,
): RouteDecision {
  if (isPublicRoute(pathname)) return "allow";
  if (!auth) return "signin";
  if (isAdminOnly(pathname) && auth.role !== "ADMIN") {
    return "unauthorised";
  }
  // League gate (ADR-012): on a league-scoped scorer/admin route (the leagueId
  // is supplied by step 21's /l/{slug} wiring), a scorer needs a grant for that
  // league; an admin bypasses. With no targetLeagueId the route is not league-
  // scoped (today's global routes) and this gate is inert.
  if (targetLeagueId !== undefined) {
    if (!canScoreLeague({ role: auth.role, grants: auth.grants ?? [], leagueId: targetLeagueId })) {
      return "unauthorised";
    }
  }
  return "allow";
}
