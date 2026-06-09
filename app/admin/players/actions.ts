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
import { makePrismaPlayerStore } from "@/lib/player-store";
import { getDefaultLeagueId } from "@/lib/league";

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
  const store = makePrismaPlayerStore(await getDefaultLeagueId());
  const result = await createPlayer(name, store);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}

export async function updatePlayerNameAction(
  id: string,
  name: string,
): Promise<PlayerResult> {
  await requireUser();
  const store = makePrismaPlayerStore(await getDefaultLeagueId());
  const result = await updatePlayerName(id, name, store);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}

export async function updatePlayerStatusAction(
  id: string,
  status: PlayerStatus,
): Promise<PlayerResult> {
  await requireUser();
  const store = makePrismaPlayerStore(await getDefaultLeagueId());
  const result = await updatePlayerStatus(id, status, store);
  if (result.ok) revalidatePath("/admin/players");
  return result;
}
