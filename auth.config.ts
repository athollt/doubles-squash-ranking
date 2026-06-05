import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { resolveSession } from "@/lib/auth-callbacks";

// Edge-safe config: no Prisma, no Node-only modules. Shared by the middleware
// (Edge runtime) and the full Node-runtime auth instance in auth.ts. The role
// is read from the already-signed JWT, so the middleware needs no DB access.
//
// The session callback (pure, Prisma-free) must live here so the EDGE auth
// instance — used by the middleware — exposes `role` on `req.auth`. Without it
// the middleware sees no role and treats every admin as unauthorised. The role
// itself is written into the JWT by the Node-runtime `jwt` callback at sign-in.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session: ({ session, token }) => resolveSession(session, token),
  },
} satisfies NextAuthConfig;
