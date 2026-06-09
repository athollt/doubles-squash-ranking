import { prisma } from "@/lib/prisma";
import { requireLeagueScorer } from "@/lib/league-access";
import { PageShell } from "@/components/ui/page-shell";
import { SettingsClient } from "./settings-client";
import { RatingExplainer } from "./rating-explainer";

export const metadata = {
  title: "Ratings — Doubles Squash @ BSC",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { league, role } = await requireLeagueScorer(slug);
  // Settings are read-only by default; only an ADMIN can edit them (the save
  // action re-checks the role — see actions.ts). Scorers view only.
  const canEdit = role === "ADMIN";

  const settings = await prisma.setting.findMany({
    where: { leagueId: league.id },
    orderBy: { key: "asc" },
    select: { key: true, value: true, description: true },
  });

  return (
    <PageShell title="Ratings">
      <div className="space-y-6">
        <RatingExplainer />
        <SettingsClient settings={settings} canEdit={canEdit} slug={slug} />
      </div>
    </PageShell>
  );
}
