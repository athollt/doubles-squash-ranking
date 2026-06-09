import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { leagueBySlug } from "@/lib/league";
import { leaguePageTitle } from "@/lib/page-title";
import { requireLeagueScorer } from "@/lib/league-access";
import { PageShell } from "@/components/ui/page-shell";
import { SettingsClient } from "./settings-client";
import { RatingExplainer } from "./rating-explainer";

// Title renders the resolved league's name (step 24): "Ratings — {displayName}".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const league = await leagueBySlug(slug);
  if (!league) return {};
  return { title: { absolute: leaguePageTitle("Ratings", league.displayName) } };
}

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
