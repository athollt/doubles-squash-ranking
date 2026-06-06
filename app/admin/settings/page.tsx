import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/page-shell";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "Settings — Doubles Squash @ BSC",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
    select: { key: true, value: true, description: true },
  });

  return (
    <PageShell title="Settings">
      <SettingsClient settings={settings} />
    </PageShell>
  );
}
