import { prisma } from "@/lib/prisma";
import { SubmitClient } from "./submit-client";

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

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Submit a session</h1>
      <SubmitClient players={players} />
    </main>
  );
}
