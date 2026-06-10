"use server";

import { auth } from "@/auth";
import { requestAccess, type RequestAccessResult } from "@/lib/access-requests";
import { prismaAccessRequestStore } from "@/lib/access-request-store";

// A signed-in non-staff user requests to help run a league (ADR-014): either
// scorer access to an existing league (leagueId set) or to set up a new one
// (leagueId null). The requester's identity comes from the session — never the
// client — so a user can only request as themselves. No email is sent.
export async function requestAccessAction(
  leagueId: string | null,
  notes: string,
): Promise<RequestAccessResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Sign in to request access." };

  return requestAccess(
    { email, name: session.user?.name ?? email, leagueId, notes },
    prismaAccessRequestStore,
  );
}
