import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canMutateSession } from "@/lib/session-authz";
import { SessionForm, type FormSlot } from "@/components/session-form";
import { PageShell } from "@/components/ui/page-shell";
import { updateSessionAction, deleteSessionAction } from "./actions";

export const metadata = {
  title: "Edit session — Doubles Squash @ BSC",
};

export const dynamic = "force-dynamic";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) redirect("/signin");

  const target = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      notes: true,
      submittedById: true,
      sessionPlayers: { select: { playerId: true, wins: true } },
    },
  });
  if (!target) notFound();

  // Ownership gate (behaviour 2): scorers may only edit their own sessions.
  if (
    !canMutateSession({
      userId: user.id,
      role: session.role,
      submittedById: target.submittedById,
    })
  ) {
    redirect("/unauthorised");
  }

  const players = await prisma.player.findMany({
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
    return updateSessionAction(id, { slots, notes });
  }
  async function onDelete() {
    "use server";
    return deleteSessionAction(id);
  }

  return (
    <PageShell title="Edit session">
      <SessionForm
        players={players}
        initialSlots={initialSlots}
        initialNotes={target.notes ?? ""}
        submitLabel="Save"
        onSubmit={onUpdate}
        onDelete={onDelete}
      />
    </PageShell>
  );
}
