"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateSettings, type SettingUpdate } from "@/lib/settings";
import { runRecalculation } from "@/lib/recalc";
import { prismaRecalcStore } from "@/lib/recalc-store";
import { leagueBySlug } from "@/lib/league";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.role !== "ADMIN") throw new Error("Forbidden");
}

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string };

// Save & Recalculate for a league's settings. Editing settings stays ADMIN-only
// (ADR-010) — the admin spans all leagues, so the grant check doesn't apply;
// the role is re-checked here (the Edit button is only UI gating).
export async function saveAndRecalculateAction(
  slug: string,
  updates: SettingUpdate[],
): Promise<SaveResult> {
  await requireAdmin();

  const validation = validateSettings(updates);
  if (!validation.ok) return { ok: false, error: validation.error };

  const league = await leagueBySlug(slug);
  if (!league) return { ok: false, error: "League not found." };
  const leagueId = league.id;

  // updateMany scoped to (leagueId, key): settings are per-League (ADR-011), and
  // `key` alone is no longer unique.
  await prisma.$transaction(
    validation.updates.map((u) =>
      prisma.setting.updateMany({
        where: { leagueId, key: u.key },
        data: { value: u.value },
      }),
    ),
  );

  await runRecalculation(prismaRecalcStore, new Date(), leagueId);

  revalidatePath(`/l/${slug}/admin/settings`);
  revalidatePath(`/l/${slug}`);
  return { ok: true };
}
