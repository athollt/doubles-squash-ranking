import { prisma } from "@/lib/prisma";
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
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <SettingsClient settings={settings} />
    </main>
  );
}
