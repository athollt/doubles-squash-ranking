"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/session-validation";
import { canMutateSession } from "@/lib/session-authz";
import { runRecalculation } from "@/lib/recalc";
import { prismaRecalcStore } from "@/lib/recalc-store";
import type { SubmitData } from "@/app/submit/actions";

export type MutateResult = { ok: true } | { ok: false; error: string };

async function authoriseFor(sessionId: string): Promise<
  | { ok: true; userId: string; leagueId: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Unauthenticated" };
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "Unauthenticated" };

  const target = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { submittedById: true, leagueId: true },
  });
  if (!target) return { ok: false, error: "Session not found." };

  const role = session.role;
  if (!canMutateSession({ userId: user.id, role, submittedById: target.submittedById })) {
    return { ok: false, error: "Forbidden" };
  }
  // Recalc + any new player scope to the edited session's own League.
  return { ok: true, userId: user.id, leagueId: target.leagueId };
}

export async function updateSessionAction(
  sessionId: string,
  data: SubmitData,
): Promise<MutateResult> {
  const authz = await authoriseFor(sessionId);
  if (!authz.ok) return authz;

  const resolved: { playerId: string; wins: number }[] = [];
  for (const slot of data.slots) {
    if (slot.newName && slot.newName.trim() !== "") {
      const created = await prisma.player.create({
        data: {
          name: slot.newName.trim(),
          createdById: authz.userId,
          leagueId: authz.leagueId,
        },
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

  // Replace SessionPlayer rows (delete old, insert new) and update totals.
  await prisma.$transaction([
    prisma.sessionPlayer.deleteMany({ where: { sessionId } }),
    prisma.session.update({
      where: { id: sessionId },
      data: {
        notes: data.notes,
        totalPlayerWins: v.totalPlayerWins,
        inferredGames: v.inferredGames,
        playerCount: v.playerCount,
        sessionPlayers: {
          create: v.players.map((p) => ({ playerId: p.playerId, wins: p.wins })),
        },
      },
    }),
  ]);

  await runRecalculation(prismaRecalcStore, new Date(), authz.leagueId);
  revalidatePath("/");
  revalidatePath("/sessions");
  return { ok: true };
}

export async function deleteSessionAction(
  sessionId: string,
): Promise<MutateResult> {
  const authz = await authoriseFor(sessionId);
  if (!authz.ok) return authz;

  // Cascade removes SessionPlayer + RatingsLog (schema onDelete: Cascade).
  await prisma.session.delete({ where: { id: sessionId } });

  await runRecalculation(prismaRecalcStore, new Date(), authz.leagueId);
  revalidatePath("/");
  revalidatePath("/sessions");
  return { ok: true };
}
