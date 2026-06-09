import { prisma } from "@/lib/prisma";
import { requireLeagueScorer } from "@/lib/league-access";
import { ladderUrlForSlug } from "@/lib/share";
import { SessionForm, type FormSlot } from "@/components/session-form";
import { PageShell } from "@/components/ui/page-shell";
import { submitSessionAction } from "./actions";

export const metadata = {
  title: "Submit a session — Doubles Squash @ BSC",
};

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { league } = await requireLeagueScorer(slug);

  const players = await prisma.player.findMany({
    where: { status: "ACTIVE", leagueId: league.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  async function onSubmit(slots: FormSlot[], notes: string) {
    "use server";
    return submitSessionAction(slug, { slots, notes });
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
        ladderUrl={ladderUrlForSlug(slug)}
        ladderHref={`/l/${slug}`}
      />
    </PageShell>
  );
}
