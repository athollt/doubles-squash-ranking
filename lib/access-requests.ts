// In-app access requests (ADR-014): a signed-in non-staff user asks to help run
// a League — either to become a Scorer for an existing League, or to set up a
// NEW League (leagueId null). An admin approves (existing → create User if
// absent + LeagueScorer grant; new → mark handled) or dismisses. No email. Pure
// orchestration over a store port so the rules are unit-testable without Prisma;
// the server actions supply the Prisma-backed store and re-check the admin role
// on approve/dismiss.

export type PendingRequest = {
  id: string;
  email: string;
  name: string;
  // null = a request to set up a NEW league (no league to grant yet).
  leagueId: string | null;
};

export interface AccessRequestStore {
  // Whether the chosen league exists (a scorer request must target a real one).
  leagueExists(id: string): Promise<boolean>;
  // Whether a PENDING request already exists for this email + league (a
  // new-league request uses leagueId null).
  pendingExists(email: string, leagueId: string | null): Promise<boolean>;
  // Write a PENDING request.
  createPending(input: {
    email: string;
    name: string;
    leagueId: string | null;
    notes: string | null;
  }): Promise<void>;
  // Load a PENDING request by id (null if absent or already resolved).
  findPendingRequest(id: string): Promise<PendingRequest | null>;
  // Find an existing staff user by email (null if none).
  findUserByEmail(email: string): Promise<{ id: string } | null>;
  // Create a SCORER user (the approval allowlists them — ADR-012).
  createScorerUser(email: string, name: string): Promise<{ id: string }>;
  // Grant a user a league (idempotent on (userId, leagueId)).
  grant(userId: string, leagueId: string): Promise<void>;
  // Set a request's status (APPROVED / DISMISSED).
  setStatus(id: string, status: "APPROVED" | "DISMISSED"): Promise<void>;
}

export type RequestAccessInput = {
  email: string;
  name: string;
  // null = request to set up a new league; a non-empty id = an existing league.
  leagueId: string | null;
  notes: string;
};
export type RequestAccessResult =
  | { ok: true }
  | { ok: false; error: string };

export async function requestAccess(
  input: RequestAccessInput,
  store: AccessRequestStore,
): Promise<RequestAccessResult> {
  const email = input.email.trim();
  const name = input.name.trim();
  const leagueId = input.leagueId === null ? null : input.leagueId.trim();
  const notes = input.notes.trim() || null;

  // A scorer request must target a real league; a new-league request (null)
  // skips that check.
  if (leagueId !== null) {
    if (leagueId === "") return { ok: false, error: "Select a league." };
    if (!(await store.leagueExists(leagueId))) {
      return { ok: false, error: "That league does not exist." };
    }
  }
  if (await store.pendingExists(email, leagueId)) {
    return {
      ok: false,
      error:
        leagueId === null
          ? "You already have a pending new-league request."
          : "You already have a pending request for that league.",
    };
  }

  await store.createPending({ email, name, leagueId, notes });
  return { ok: true };
}

export type ReviewResult = { ok: true } | { ok: false; error: string };

// Approve a pending request (admin action re-checks the role). For an existing
// league: allowlist the requester (create the SCORER user if absent) and grant
// them that league — the same find-or-create + grant sequence as step 22's
// assign-Scorer flow. For a new-league request (no league): just mark it
// handled; the admin creates the league + assigns the scorer manually (ADR-014).
export async function approveAccessRequest(
  id: string,
  store: AccessRequestStore,
): Promise<ReviewResult> {
  const request = await store.findPendingRequest(id);
  if (!request) return { ok: false, error: "Request not found." };

  if (request.leagueId !== null) {
    const existing = await store.findUserByEmail(request.email);
    const user =
      existing ?? (await store.createScorerUser(request.email, request.name));
    await store.grant(user.id, request.leagueId);
  }
  await store.setStatus(id, "APPROVED");
  return { ok: true };
}

// Dismiss a pending request (admin action re-checks the role): mark it DISMISSED.
// No user is created and no grant is made.
export async function dismissAccessRequest(
  id: string,
  store: AccessRequestStore,
): Promise<ReviewResult> {
  const request = await store.findPendingRequest(id);
  if (!request) return { ok: false, error: "Request not found." };
  await store.setStatus(id, "DISMISSED");
  return { ok: true };
}
