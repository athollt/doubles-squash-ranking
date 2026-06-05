export type Role = "ADMIN" | "SCORER";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface UserStore {
  findByEmailInsensitive(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  countAdmins(): Promise<number>;
  create(email: string, name: string, role: Role): Promise<UserRecord>;
  updateRole(id: string, role: Role): Promise<UserRecord>;
  delete(id: string): Promise<void>;
}

export type UserResult =
  | { ok: true; user: UserRecord }
  | { ok: false; error: string };

export type DeleteResult = { ok: true } | { ok: false; error: string };

// Pragmatic email check: one @, no spaces, a dot in the domain. Good enough to
// reject obvious typos; the real gate is the auth allowlist, not this regex.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createUser(
  email: string,
  name: string,
  role: Role,
  store: UserStore,
): Promise<UserResult> {
  const trimmedEmail = email.trim();
  const trimmedName = name.trim();
  if (!EMAIL_RE.test(trimmedEmail)) {
    return { ok: false, error: "A valid email is required." };
  }
  if (trimmedName === "") {
    return { ok: false, error: "Name is required." };
  }
  const existing = await store.findByEmailInsensitive(trimmedEmail);
  if (existing) {
    return { ok: false, error: "A user with that email already exists." };
  }
  const user = await store.create(trimmedEmail, trimmedName, role);
  return { ok: true, user };
}

export async function updateUserRole(
  id: string,
  role: Role,
  store: UserStore,
): Promise<UserResult> {
  const user = await store.updateRole(id, role);
  return { ok: true, user };
}

export async function deleteUser(
  id: string,
  actingUserId: string,
  store: UserStore,
): Promise<DeleteResult> {
  if (id === actingUserId) {
    return { ok: false, error: "You cannot remove yourself." };
  }
  const target = await store.findById(id);
  if (!target) {
    return { ok: false, error: "User not found." };
  }
  if (target.role === "ADMIN" && (await store.countAdmins()) <= 1) {
    return { ok: false, error: "Cannot remove the last admin." };
  }
  await store.delete(id);
  return { ok: true };
}
