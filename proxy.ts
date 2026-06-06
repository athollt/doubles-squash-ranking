import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { authorizeRoute } from "@/lib/auth-rules";

// Next.js proxy convention (replaces the deprecated middleware.ts). Runs in the
// Node runtime, so it shares the single auth instance from auth.ts — no
// separate Edge-safe config needed (DECISIONS.md ADR-007). It only reads the
// role off the signed JWT; route decisions live in the pure authorizeRoute.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const decision = authorizeRoute(
    pathname,
    req.auth ? { role: req.auth.role } : null,
  );

  if (decision === "signin") {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  if (decision === "unauthorised") {
    return NextResponse.redirect(new URL("/unauthorised", req.nextUrl.origin));
  }

  return NextResponse.next();
});

// Run on everything except Next.js internals and static assets. Auth API
// routes (/api/auth/*) are matched but treated as public by authorizeRoute.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
