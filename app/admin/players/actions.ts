"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createPlayer,
  updatePlayerName,
  updatePlayerStatus,
  type PlayerResult,
  type PlayerStatus,
} from "@/lib/players";
import { prismaPlayerStore } from "@/lib/player-store";

// Players management is open to any signed-in user (scorers and admins) — the
// route gate already keeps the public out (step 16.x). Defence in depth: still
// require a session before mutating.
async function requireUser(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Forbidden");
  }
}

export async function createPlayerAction(
  name: string,
): Promise<PlayerResult> {
  await requireUser();
  const result = await createPlayer(name, prismaPlayerStore);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}

export async function updatePlayerNameAction(
  id: string,
  name: string,
): Promise<PlayerResult> {
  await requireUser();
  const result = await updatePlayerName(id, name, prismaPlayerStore);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}

export async function updatePlayerStatusAction(
  id: string,
  status: PlayerStatus,
): Promise<PlayerResult> {
  await requireUser();
  const result = await updatePlayerStatus(id, status, prismaPlayerStore);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}
