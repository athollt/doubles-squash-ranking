import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/page-shell";
import { SettingsClient } from "./settings-client";
import { RatingExplainer } from "./rating-explainer";

export const metadata = {
  title: "Settings — Doubles Squash @ BSC",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  // Settings are read-only by default; only an ADMIN can edit them (the save
  // action re-checks the role — see actions.ts). Scorers view only.
  const canEdit = session?.role === "ADMIN";

  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
    select: { key: true, value: true, description: true },
  });

  return (
    <PageShell title="Settings">
      <div className="space-y-6">
        <RatingExplainer />
        <SettingsClient settings={settings} canEdit={canEdit} />
      </div>
    </PageShell>
  );
}
