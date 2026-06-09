import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/page-shell";
import { AccessRequestsClient } from "./access-requests-client";

export const metadata = {
  title: "Access requests — Rungs",
};

// The approval queue (ADR-014, stories #6/#7): a global admin reviews pending
// access requests and approves (→ create User + grant) or dismisses them.
// Route-gated ADMIN-only (authorizeRoute isAdminOnly); re-checked here + in the
// server actions.
export const dynamic = "force-dynamic";

export default async function AdminAccessRequestsPage() {
  const session = await auth();
  if (session?.role !== "ADMIN") redirect("/unauthorised");

  const requestsRaw = await prisma.accessRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      notes: true,
      createdAt: true,
      league: { select: { displayName: true } },
    },
  });

  const requests = requestsRaw.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    // A new-league request has no league row — surface it as such.
    league: r.league?.displayName ?? null,
    notes: r.notes,
    createdAt: r.createdAt.toISOString().slice(0, 10),
  }));

  return (
    <PageShell
      title="Access requests"
      subtitle="People asking to score for a league. Approve to grant access, or dismiss."
    >
      <AccessRequestsClient requests={requests} />
    </PageShell>
  );
}
