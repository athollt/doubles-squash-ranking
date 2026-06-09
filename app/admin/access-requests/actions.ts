"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  approveAccessRequest,
  dismissAccessRequest,
  type ReviewResult,
} from "@/lib/access-requests";
import { prismaAccessRequestStore } from "@/lib/access-request-store";

// Reviewing access requests is global-Admin only (ADR-014). The forms are
// admin-only UI; the server is the real gate.
async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.role !== "ADMIN") throw new Error("Forbidden");
}

// Approve: create the User (if absent) + the LeagueScorer grant — the same
// flow step 22's assign-Scorer uses — and mark the request approved.
export async function approveAccessRequestAction(
  id: string,
): Promise<ReviewResult> {
  await requireAdmin();
  const result = await approveAccessRequest(id, prismaAccessRequestStore);
  if (result.ok) {
    revalidatePath("/admin/access-requests");
    revalidatePath("/");
  }
  return result;
}

export async function dismissAccessRequestAction(
  id: string,
): Promise<ReviewResult> {
  await requireAdmin();
  const result = await dismissAccessRequest(id, prismaAccessRequestStore);
  if (result.ok) revalidatePath("/admin/access-requests");
  return result;
}
