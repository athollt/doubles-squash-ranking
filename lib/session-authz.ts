export interface MutateCheck {
  userId: string;
  role: "ADMIN" | "SCORER" | undefined;
  submittedById: string;
  // League-scope inputs (ADR-012). Supplied once sessions are league-scoped
  // (step 21 wiring); when both are present a scorer must also be granted the
  // session's league. Omitted → the pre-multi-tenant own-session rule only.
  grants?: string[];
  sessionLeagueId?: string;
}

// A session may be edited or deleted by an admin (any session) or by the scorer
// who submitted it — and, once league-scoped, only within a league that scorer
// is granted (ADR-012, extending ADR-010). PRD user stories #12, #13, #16.
export function canMutateSession({
  userId,
  role,
  submittedById,
  grants,
  sessionLeagueId,
}: MutateCheck): boolean {
  if (role === "ADMIN") return true;
  if (userId !== submittedById) return false;
  // Own session: if a league scope is supplied, the scorer must be granted it.
  if (sessionLeagueId !== undefined) {
    return (grants ?? []).includes(sessionLeagueId);
  }
  return true;
}
