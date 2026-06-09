import { validateNewSlug } from "@/lib/slug";

// Admin provisioning flows (step 22, ADR-012): create a League (+ seed its
// settings) and assign a Scorer (allowlist the user if new, then grant). Pure
// orchestration over a store port so they are unit-testable without Prisma; the
// server actions supply the Prisma-backed store and re-check the admin role.

export type CreatedLeague = { id: string; slug: string; displayName: string };
export type StoreUser = { id: string; email: string; name: string };

export interface LeagueProvisioningStore {
  slugTaken(slug: string): Promise<boolean>;
  // Create the league and seed its default settings in one transaction.
  createLeagueWithSettings(input: {
    name: string;
    displayName: string;
    slug: string;
  }): Promise<CreatedLeague>;
  findUserByEmail(email: string): Promise<StoreUser | null>;
  createUser(email: string, name: string): Promise<StoreUser>;
  grant(userId: string, leagueId: string): Promise<void>;
}

// Same pragmatic check as lib/users.ts — the real gate is the auth allowlist.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateLeagueInput = {
  name: string;
  displayName: string;
  slug: string;
};
export type CreateLeagueResult =
  | { ok: true; league: CreatedLeague }
  | { ok: false; error: string };

export async function createLeague(
  input: CreateLeagueInput,
  store: LeagueProvisioningStore,
): Promise<CreateLeagueResult> {
  const name = input.name.trim();
  const displayName = input.displayName.trim();
  const slug = input.slug.trim();

  if (name === "") return { ok: false, error: "Name is required." };
  if (displayName === "") {
    return { ok: false, error: "Display name is required." };
  }

  const slugCheck = validateNewSlug(slug, { taken: await store.slugTaken(slug) });
  if (!slugCheck.ok) return { ok: false, error: slugCheck.error };

  const league = await store.createLeagueWithSettings({ name, displayName, slug });
  return { ok: true, league };
}

export type AssignScorerInput = { email: string; name: string; leagueId: string };
export type AssignScorerResult =
  | { ok: true }
  | { ok: false; error: string };

export async function assignScorer(
  input: AssignScorerInput,
  store: LeagueProvisioningStore,
): Promise<AssignScorerResult> {
  const email = input.email.trim();
  const name = input.name.trim();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "A valid email is required." };
  }
  if (name === "") return { ok: false, error: "Name is required." };

  const existing = await store.findUserByEmail(email);
  const user = existing ?? (await store.createUser(email, name));
  await store.grant(user.id, input.leagueId);
  return { ok: true };
}
