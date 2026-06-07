export type RouteDecision = "allow" | "signin" | "unauthorised";

export interface RouteAuth {
  role?: string;
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
): RouteDecision {
  if (isPublicRoute(pathname)) return "allow";
  if (!auth) return "signin";
  if (isAdminOnly(pathname) && auth.role !== "ADMIN") {
    return "unauthorised";
  }
  return "allow";
}
