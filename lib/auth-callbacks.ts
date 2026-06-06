export interface AppUser {
  role: string;
}

export type UserLookup = (email: string) => Promise<AppUser | null>;

export interface AuthToken {
  role?: string;
  [key: string]: unknown;
}

// signIn callback: deny a Google account whose email is not in the users table.
export async function resolveSignIn(
  email: string | null | undefined,
  lookup: UserLookup,
): Promise<true | string> {
  if (!email) return "/unauthorised";
  const appUser = await lookup(email);
  if (!appUser) return "/unauthorised";
  return true;
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
