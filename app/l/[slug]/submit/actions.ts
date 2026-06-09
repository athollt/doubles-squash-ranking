"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/session-validation";
import { runRecalculation } from "@/lib/recalc";
import { prismaRecalcStore } from "@/lib/recalc-store";
import { resolvePlayerName } from "@/lib/players";
import { makePrismaPlayerStore } from "@/lib/player-store";
import { requireLeagueScorer } from "@/lib/league-access";

export interface SubmitSlot {
  playerId?: string;
  newName?: string;
  wins: number;
}

export interface SubmitData {
  slots: SubmitSlot[];
  notes?: string;
}

export type SubmitResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export async function submitSessionAction(
  slug: string,
  data: SubmitData,
): Promise<SubmitResult> {
  // Server-side gate (defence in depth beyond the page): resolves the league,
  // 404s an unknown slug, and enforces the scorer grant (ADR-012).
  const { league, userId } = await requireLeagueScorer(slug);
  const leagueId = league.id;
  const playerStore = makePrismaPlayerStore(leagueId);

  // Resolve on-the-fly players (slots with a newName) into real players first.
  // resolvePlayerName reuses an existing player whose name matches (case-
  // insensitive, within this League) rather than creating a duplicate row.
  const resolved: { playerId: string; wins: number }[] = [];
  for (const slot of data.slots) {
    if (slot.newName && slot.newName.trim() !== "") {
      const r = await resolvePlayerName(slot.newName, playerStore);
      if (!r.ok) return { ok: false, error: r.error };
      resolved.push({ playerId: r.playerId, wins: slot.wins });
    } else if (slot.playerId) {
      resolved.push({ playerId: slot.playerId, wins: slot.wins });
    }
  }

  const validation = validateSession({ players: resolved });
  if (!validation.ok) return { ok: false, error: validation.error };
  const v = validation.session;

  const session = await prisma.session.create({
    data: {
      timestamp: new Date(),
      submittedById: userId,
      leagueId,
      notes: data.notes,
      totalPlayerWins: v.totalPlayerWins,
      inferredGames: v.inferredGames,
      playerCount: v.playerCount,
      sessionPlayers: {
        create: v.players.map((p) => ({
          playerId: p.playerId,
          wins: p.wins,
        })),
      },
    },
    select: { id: true },
  });

  await runRecalculation(prismaRecalcStore, new Date(), leagueId);

  revalidatePath(`/l/${slug}`);
  revalidatePath(`/l/${slug}/sessions`);
  return { ok: true, sessionId: session.id };
}
