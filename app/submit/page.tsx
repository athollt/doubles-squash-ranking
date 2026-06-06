import { prisma } from "@/lib/prisma";
import { SessionForm, type FormSlot } from "@/components/session-form";
import { PageShell } from "@/components/ui/page-shell";
import { submitSessionAction } from "./actions";

export const metadata = {
  title: "Submit a session — Doubles Squash @ BSC",
};

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const players = await prisma.player.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  async function onSubmit(slots: FormSlot[], notes: string) {
    "use server";
    return submitSessionAction({ slots, notes });
  }

  return (
    <PageShell
      title="Submit a session"
      subtitle="Add each player and the games they won · courtside"
    >
      <SessionForm
        players={players}
        submitLabel="Log Results"
        onSubmit={onSubmit}
      />
    </PageShell>
  );
}
