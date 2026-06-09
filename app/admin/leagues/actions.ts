"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createLeague,
  assignScorer,
  type CreateLeagueResult,
  type AssignScorerResult,
} from "@/lib/league-provisioning";
import { prismaLeagueProvisioningStore } from "@/lib/league-provisioning-store";

// League provisioning is global-Admin only (ADR-012). The forms are admin-only
// UI, but the server is the real gate.
async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.role !== "ADMIN") throw new Error("Forbidden");
}

export async function createLeagueAction(
  name: string,
  displayName: string,
  slug: string,
): Promise<CreateLeagueResult> {
  await requireAdmin();
  const result = await createLeague(
    { name, displayName, slug },
    prismaLeagueProvisioningStore,
  );
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/admin/leagues");
  }
  return result;
}

export async function assignScorerAction(
  email: string,
  name: string,
  leagueId: string,
): Promise<AssignScorerResult> {
  await requireAdmin();
  const result = await assignScorer(
    { email, name, leagueId },
    prismaLeagueProvisioningStore,
  );
  if (result.ok) revalidatePath("/admin/leagues");
  return result;
}
