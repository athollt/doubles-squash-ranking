import { validateNewSlug } from "@/lib/slug";

// Admin provisioning flows (step 22, ADR-012): create a League (+ seed its
// settings) and assign a Scorer (allowlist the user if new, then grant). Pure
// orchestration over a store port so they are unit-testable without Prisma; the
// server actions supply the Prisma-backed store and re-check the admin role.

export type CreatedLeague = { id: string; slug: string; displayName: string };

export interface LeagueProvisioningStore {
  slugTaken(slug: string): Promise<boolean>;
  // Create the league and seed its default settings in one transaction.
  createLeagueWithSettings(input: {
    name: string;
    displayName: string;
    slug: string;
  }): Promise<CreatedLeague>;
  // Update a league's editable details (name + displayName; slug is immutable,
  // ADR-013).
  updateLeagueDetails(
    id: string,
    input: { name: string; displayName: string },
  ): Promise<CreatedLeague>;
  grant(userId: string, leagueId: string): Promise<void>;
}

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

export type UpdateLeagueInput = { name: string; displayName: string };

// Edit a league's details. The slug is immutable (ADR-013) — not editable here.
export async function updateLeague(
  id: string,
  input: UpdateLeagueInput,
  store: LeagueProvisioningStore,
): Promise<CreateLeagueResult> {
  const name = input.name.trim();
  const displayName = input.displayName.trim();
  if (name === "") return { ok: false, error: "Name is required." };
  if (displayName === "") {
    return { ok: false, error: "Display name is required." };
  }
  const league = await store.updateLeagueDetails(id, { name, displayName });
  return { ok: true, league };
}

export type AssignScorerInput = { userId: string; leagueId: string };
export type AssignScorerResult =
  | { ok: true }
  | { ok: false; error: string };

// Grant an existing scorer the chosen league (ADR-012). The scorer is picked
// from existing Users; creating new accounts is the Users page's job.
export async function assignScorer(
  input: AssignScorerInput,
  store: LeagueProvisioningStore,
): Promise<AssignScorerResult> {
  if (!input.userId) return { ok: false, error: "Select a scorer." };
  if (!input.leagueId) return { ok: false, error: "Select a league." };
  await store.grant(input.userId, input.leagueId);
  return { ok: true };
}
