import { describe, it, expect } from "vitest";
import { canScoreLeague, authorizeRoute } from "@/lib/auth-rules";

// Per-league scorer authority (ADR-012): a SCORER's power comes entirely from a
// LeagueScorer grant for that league; a global ADMIN bypasses the grant check.
describe("canScoreLeague", () => {
  it("lets an admin score any league without a grant", () => {
    expect(
      canScoreLeague({ role: "ADMIN", grants: [], leagueId: "L1" }),
    ).toBe(true);
  });

  it("lets a scorer score a league they are granted", () => {
    expect(
      canScoreLeague({ role: "SCORER", grants: ["L1", "L2"], leagueId: "L2" }),
    ).toBe(true);
  });

  it("denies a scorer a league they are not granted", () => {
    expect(
      canScoreLeague({ role: "SCORER", grants: ["L1"], leagueId: "L2" }),
    ).toBe(false);
  });
});

// authorizeRoute gains an optional target league (the slug→leagueId of an
// /l/{slug} scorer/admin route, wired in step 21). When supplied, a scorer needs
// a grant for that league; admin bypasses; public league reads still allow.
describe("authorizeRoute — league gate", () => {
  it("denies a scorer with no grant for the target league", () => {
    expect(
      authorizeRoute("/admin/players", { role: "SCORER", grants: [] }, "L2"),
    ).toBe("unauthorised");
  });

  it("allows a scorer with a grant for the target league", () => {
    expect(
      authorizeRoute("/admin/players", { role: "SCORER", grants: ["L2"] }, "L2"),
    ).toBe("allow");
  });

  it("allows an admin into a target league's scorer surface without a grant", () => {
    expect(
      authorizeRoute("/admin/players", { role: "ADMIN", grants: [] }, "L2"),
    ).toBe("allow");
  });

  it("keeps a public league read open regardless of grants", () => {
    // The public ladder is a public route; the league gate must not close it.
    expect(authorizeRoute("/", null, "L2")).toBe("allow");
    expect(authorizeRoute("/sessions", null, "L2")).toBe("allow");
  });

  it("redirects an unauthenticated visitor on a league scorer route to sign-in", () => {
    expect(authorizeRoute("/admin/players", null, "L2")).toBe("signin");
  });

  it("still requires ADMIN for the Users surface even with a league grant", () => {
    expect(
      authorizeRoute("/admin/users", { role: "SCORER", grants: ["L2"] }, "L2"),
    ).toBe("unauthorised");
  });
});
