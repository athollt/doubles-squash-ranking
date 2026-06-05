import { describe, it, expect } from "vitest";
import { canMutateSession } from "@/lib/session-authz";

describe("canMutateSession", () => {
  it("lets a scorer mutate their own session", () => {
    expect(
      canMutateSession({ userId: "u1", role: "SCORER", submittedById: "u1" }),
    ).toBe(true);
  });

  it("forbids a scorer from mutating another scorer's session", () => {
    expect(
      canMutateSession({ userId: "u1", role: "SCORER", submittedById: "u2" }),
    ).toBe(false);
  });

  it("lets an admin mutate any session", () => {
    expect(
      canMutateSession({ userId: "admin", role: "ADMIN", submittedById: "u2" }),
    ).toBe(true);
  });
});
