import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import {
  resolveSignIn,
  resolveJwt,
  resolveSession,
} from "@/lib/auth-callbacks";

const lookupUser = (email: string) =>
  prisma.user.findUnique({ where: { email }, select: { role: true } });

// Full Node-runtime auth instance: the Prisma-backed callbacks run here (route
// handler, server actions), never in the Edge middleware.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    signIn: ({ user }) => resolveSignIn(user.email, lookupUser),
    jwt: ({ token, user }) => resolveJwt(token, user, lookupUser),
    session: ({ session, token }) => resolveSession(session, token),
  },
});
