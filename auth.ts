import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  resolveSignIn,
  resolveJwt,
  resolveSession,
  verifyCredentials,
} from "@/lib/auth-callbacks";

const lookupUser = (email: string) =>
  prisma.user.findUnique({ where: { email }, select: { role: true } });

const lookupCredentialUser = (email: string) =>
  prisma.user.findUnique({
    where: { email },
    select: { email: true, passwordHash: true },
  });

// Single auth instance. The proxy (proxy.ts) and the route handler / server
// actions all use it. proxy.ts runs in the Node runtime, so there is no longer
// an Edge constraint forcing a Prisma-free config (DECISIONS.md ADR-007 —
// supersedes the ADR-006 split). Google sits alongside Credentials so the app
// can be signed into for manual testing and E2E without Google Cloud creds.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) =>
        verifyCredentials(
          String(credentials?.email ?? ""),
          String(credentials?.password ?? ""),
          lookupCredentialUser,
          verifyPassword,
        ),
    }),
  ],
  callbacks: {
    signIn: ({ user }) => resolveSignIn(user.email, lookupUser),
    jwt: ({ token, user }) => resolveJwt(token, user, lookupUser),
    session: ({ session, token }) => resolveSession(session, token),
  },
});
