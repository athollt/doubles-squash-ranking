"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateSettings, type SettingUpdate } from "@/lib/settings";
import { runRecalculation } from "@/lib/recalc";
import { prismaRecalcStore } from "@/lib/recalc-store";
import { getDefaultLeagueId } from "@/lib/league";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.role !== "ADMIN") throw new Error("Forbidden");
}

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string };

// Save & Recalculate: validate, persist changed values, then run a full
// recalculation (behaviour 4).
export async function saveAndRecalculateAction(
  updates: SettingUpdate[],
): Promise<SaveResult> {
  await requireAdmin();

  const validation = validateSettings(updates);
  if (!validation.ok) return { ok: false, error: validation.error };

  const leagueId = await getDefaultLeagueId();

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

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true };
}
