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

  it("lets a scorer mutate their own session in a league they are granted", () => {
    expect(
      canMutateSession({
        userId: "u1",
        role: "SCORER",
        submittedById: "u1",
        grants: ["L1"],
        sessionLeagueId: "L1",
      }),
    ).toBe(true);
  });

  it("forbids a scorer from mutating their own session in a league they are NOT granted", () => {
    expect(
      canMutateSession({
        userId: "u1",
        role: "SCORER",
        submittedById: "u1",
        grants: ["L1"],
        sessionLeagueId: "L2",
      }),
    ).toBe(false);
  });

  it("forbids a scorer from mutating another scorer's session even in a granted league", () => {
    expect(
      canMutateSession({
        userId: "u1",
        role: "SCORER",
        submittedById: "u2",
        grants: ["L1"],
        sessionLeagueId: "L1",
      }),
    ).toBe(false);
  });

  it("lets an admin mutate any session regardless of grants/league", () => {
    expect(
      canMutateSession({
        userId: "admin",
        role: "ADMIN",
        submittedById: "u2",
        grants: [],
        sessionLeagueId: "L9",
      }),
    ).toBe(true);
  });
});
