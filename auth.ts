import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
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

// Full Node-runtime auth instance: the Prisma-backed callbacks and the
// Credentials provider (bcrypt) run here (route handler, server actions),
// never in the Edge middleware. Credentials sits alongside Google so the app
// can be signed into for manual testing and E2E without Google Cloud creds
// (DECISIONS.md ADR-006).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: { signIn: "/signin" },
  providers: [
    ...authConfig.providers,
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
