"use server";

import { revalidatePath } from "next/cache";
import {
  createPlayer,
  updatePlayerName,
  updatePlayerStatus,
  type PlayerResult,
  type PlayerStatus,
} from "@/lib/players";
import { makePrismaPlayerStore } from "@/lib/player-store";
import { requireLeagueScorer } from "@/lib/league-access";

export async function createPlayerAction(
  slug: string,
  name: string,
): Promise<PlayerResult> {
  const { league } = await requireLeagueScorer(slug);
  const store = makePrismaPlayerStore(league.id);
  const result = await createPlayer(name, store);
  if (result.ok) revalidatePath(`/l/${slug}/admin/players`);
  return result;
}

export async function updatePlayerNameAction(
  slug: string,
  id: string,
  name: string,
): Promise<PlayerResult> {
  const { league } = await requireLeagueScorer(slug);
  const store = makePrismaPlayerStore(league.id);
  const result = await updatePlayerName(id, name, store);
  if (result.ok) revalidatePath(`/l/${slug}/admin/players`);
  return result;
}

export async function updatePlayerStatusAction(
  slug: string,
  id: string,
  status: PlayerStatus,
): Promise<PlayerResult> {
  const { league } = await requireLeagueScorer(slug);
  const store = makePrismaPlayerStore(league.id);
  const result = await updatePlayerStatus(id, status, store);
  if (result.ok) revalidatePath(`/l/${slug}/admin/players`);
  return result;
}
