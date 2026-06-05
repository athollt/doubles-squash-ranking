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

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
}

export async function createPlayerAction(
  name: string,
): Promise<PlayerResult> {
  await requireAdmin();
  const result = await createPlayer(name, prismaPlayerStore);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}

export async function updatePlayerNameAction(
  id: string,
  name: string,
): Promise<PlayerResult> {
  await requireAdmin();
  const result = await updatePlayerName(id, name, prismaPlayerStore);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}

export async function updatePlayerStatusAction(
  id: string,
  status: PlayerStatus,
): Promise<PlayerResult> {
  await requireAdmin();
  const result = await updatePlayerStatus(id, status, prismaPlayerStore);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}
