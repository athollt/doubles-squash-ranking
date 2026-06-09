export interface AppUser {
  role: string;
}

export type UserLookup = (email: string) => Promise<AppUser | null>;

export interface AuthToken {
  role?: string;
  [key: string]: unknown;
}

// signIn callback (ADR-012/014). Staff (a users-table row) sign in regardless of
// provider. A non-staff Google account is now ALLOWED — it gets a role-less
// session and the landing bounces it to /request-access (bounceTarget). The
// User table stays staff-only; only sessions open up. The Credentials path stays
// staff-only (no session for a non-staff email) — defence-in-depth on top of
// verifyCredentials, which already requires a stored hash non-staff never have.
export async function resolveSignIn(
  email: string | null | undefined,
  provider: string,
  lookup: UserLookup,
): Promise<true | string> {
  if (!email) return "/unauthorised";
  const appUser = await lookup(email);
  if (appUser) return true;
  return provider === "google" ? true : "/unauthorised";
}

// jwt callback: on first sign-in (user present) attach the role from the
// users table; on later requests the token already carries it.
export async function resolveJwt(
  token: AuthToken,
  user: { email?: string | null } | undefined,
  lookup: UserLookup,
): Promise<AuthToken> {
  if (user?.email) {
    const appUser = await lookup(user.email);
    token.role = appUser?.role;
  }
  return token;
}

// session callback: copy the role from the JWT onto the session so server
// components and the client can read it.
export function resolveSession<S extends { role?: string }>(
  session: S,
  token: AuthToken,
): S {
  session.role = token.role;
  return session;
}

export interface CredentialUser {
  email: string;
  passwordHash: string | null;
}

export type CredentialLookup = (
  email: string,
) => Promise<CredentialUser | null>;

export type PasswordVerifier = (
  plain: string,
  hash: string,
) => Promise<boolean>;

// Credentials provider authorize(): look up the user, verify the password hash.
// Returns the minimal identity for Auth.js (the allowlist/role callbacks then
// run on top of this), or null to reject. Role is NOT trusted from here.
export async function verifyCredentials(
  email: string,
  password: string,
  lookup: CredentialLookup,
  verify: PasswordVerifier,
): Promise<{ email: string } | null> {
  const user = await lookup(email);
  if (!user || !user.passwordHash) return null;
  const ok = await verify(password, user.passwordHash);
  return ok ? { email: user.email } : null;
}
