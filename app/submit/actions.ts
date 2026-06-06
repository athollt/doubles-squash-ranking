"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/session-validation";
import { runRecalculation } from "@/lib/recalc";
import { prismaRecalcStore } from "@/lib/recalc-store";

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

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthenticated");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Unauthenticated");
  return user.id;
}

export async function submitSessionAction(
  data: SubmitData,
): Promise<SubmitResult> {
  const userId = await requireUserId();

  // Resolve on-the-fly players (slots with a newName) into real players first.
  const resolved: { playerId: string; wins: number }[] = [];
  for (const slot of data.slots) {
    if (slot.newName && slot.newName.trim() !== "") {
      const created = await prisma.player.create({
        data: { name: slot.newName.trim(), createdById: userId },
        select: { id: true },
      });
      resolved.push({ playerId: created.id, wins: slot.wins });
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

  await runRecalculation(prismaRecalcStore, new Date());

  revalidatePath("/");
  revalidatePath("/sessions");
  return { ok: true, sessionId: session.id };
}
