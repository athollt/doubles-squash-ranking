import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { leagueBySlug } from "@/lib/league";
import { leaguePageTitle } from "@/lib/page-title";
import { canMutateSession } from "@/lib/session-authz";
import { requireLeagueScorer } from "@/lib/league-access";
import { prismaLeagueScorerStore } from "@/lib/league-scorer-store";
import { SessionForm, type FormSlot } from "@/components/session-form";
import { PageShell } from "@/components/ui/page-shell";
import { updateSessionAction, deleteSessionAction } from "./actions";

// Title renders the resolved league's name (step 24): "Edit session — {displayName}".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const league = await leagueBySlug(slug);
  if (!league) return {};
  return { title: { absolute: leaguePageTitle("Edit session", league.displayName) } };
}

export const dynamic = "force-dynamic";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  // League gate (404 unknown slug, signin if logged out, unauthorised if no
  // grant for this league).
  const { league, userId, role } = await requireLeagueScorer(slug);

  const target = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      notes: true,
      submittedById: true,
      leagueId: true,
      sessionPlayers: { select: { playerId: true, wins: true } },
    },
  });
  // Unknown session, or one from another league.
  if (!target || target.leagueId !== league.id) notFound();

  // Ownership + league-scope gate (ADR-010/012): scorers edit only their own
  // session, within a league they are granted; admins edit any.
  const grants = await prismaLeagueScorerStore.leagueIdsFor(userId);
  if (
    !canMutateSession({
      userId,
      role,
      submittedById: target.submittedById,
      grants,
      sessionLeagueId: target.leagueId,
    })
  ) {
    redirect("/unauthorised");
  }

  const players = await prisma.player.findMany({
    where: { leagueId: league.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const initialSlots = target.sessionPlayers.map((sp) => ({
    playerId: sp.playerId,
    newName: "",
    wins: String(sp.wins),
  }));

  async function onUpdate(slots: FormSlot[], notes: string) {
    "use server";
    return updateSessionAction(slug, id, { slots, notes });
  }
  async function onDelete() {
    "use server";
    return deleteSessionAction(slug, id);
  }

  return (
    <PageShell title="Edit session" back={{ href: `/l/${slug}/sessions`, label: "Session history" }}>
      <SessionForm
        players={players}
        initialSlots={initialSlots}
        initialNotes={target.notes ?? ""}
        submitLabel="Save"
        onSubmit={onUpdate}
        onDelete={onDelete}
        ladderHref={`/l/${slug}`}
      />
    </PageShell>
  );
}
