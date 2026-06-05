import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-safe config: no Prisma, no Node-only modules. Shared by the middleware
// (Edge runtime) and the full Node-runtime auth instance in auth.ts. The role
// is read from the already-signed JWT, so the middleware needs no DB access.
export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
} satisfies NextAuthConfig;
