import { prisma } from "@/lib/prisma";
import { SessionForm, type FormSlot } from "@/components/session-form";
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
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Submit a session</h1>
      <SessionForm
        players={players}
        submitLabel="Submit session"
        onSubmit={onSubmit}
      />
    </main>
  );
}
