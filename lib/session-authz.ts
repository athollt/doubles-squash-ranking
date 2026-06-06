export interface MutateCheck {
  userId: string;
  role: "ADMIN" | "SCORER" | undefined;
  submittedById: string;
}

// A session may be edited or deleted by an admin (any session) or by the
// scorer who submitted it (their own only). PRD user stories #12, #13, #16.
export function canMutateSession({
  userId,
  role,
  submittedById,
}: MutateCheck): boolean {
  if (role === "ADMIN") return true;
  return userId === submittedById;
}
