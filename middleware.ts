import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { authorizeRoute } from "@/lib/auth-rules";

// Build an Edge-safe auth instance from the Prisma-free config. The middleware
// only reads the role off the signed JWT, so no DB access is needed here.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const decision = authorizeRoute(
    pathname,
    req.auth ? { role: req.auth.role } : null,
  );

  if (decision === "signin") {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
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
