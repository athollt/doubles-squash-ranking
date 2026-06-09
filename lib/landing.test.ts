import { describe, it, expect } from "vitest";
import {
  visibleLeaguesFor,
  bounceTarget,
  type LeagueListItem,
} from "@/lib/landing";

const A: LeagueListItem = { id: "a", slug: "a", displayName: "A" };
const B: LeagueListItem = { id: "b", slug: "b", displayName: "B" };
const C: LeagueListItem = { id: "c", slug: "c", displayName: "C" };
const ALL = [A, B, C];

// The landing list (step 22) and the league switcher are the same view: which
// leagues an actor may act on / browse. Pure — the caller supplies all leagues
// and the actor's role + grants.
describe("visibleLeaguesFor", () => {
  it("shows an admin every league", () => {
    expect(
      visibleLeaguesFor({ role: "ADMIN", grants: [] }, ALL).map((l) => l.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("shows a scorer only the leagues they are granted", () => {
    expect(
      visibleLeaguesFor({ role: "SCORER", grants: ["b"] }, ALL).map((l) => l.id),
    ).toEqual(["b"]);
  });

  it("shows a scorer with no grants every league (browse like a visitor)", () => {
    // A scorer awaiting their first grant can't act anywhere yet, so the landing
    // is just the public browse list — not a dead end. The grant filter only
    // narrows the list once they actually hold grants.
    expect(
      visibleLeaguesFor({ role: "SCORER", grants: [] }, ALL).map((l) => l.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("shows a signed-in non-staff user (no role) every league, like a visitor", () => {
    // A role-less signed-in user is non-staff: they browse the public list the
    // same as a signed-out visitor (ADR-013/014), not the staff switcher.
    expect(
      visibleLeaguesFor({ role: undefined, grants: [] }, ALL).map((l) => l.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("shows a signed-out visitor every league (public ladders are browsable)", () => {
    expect(visibleLeaguesFor(null, ALL).map((l) => l.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

// A signed-in user who is neither an admin nor holds any scorer grant is
// non-staff (ADR-012/014): the landing routes them to the access-request bounce
// page. Everyone else stays put (null = no redirect): an admin, a granted
// scorer, and a signed-out visitor (who browses public ladders).
describe("bounceTarget", () => {
  it("routes a signed-in non-staff user (no role, no grants) to /request-access", () => {
    expect(bounceTarget({ role: undefined, grants: [] })).toBe("/request-access");
  });

  it("does not bounce an admin", () => {
    expect(bounceTarget({ role: "ADMIN", grants: [] })).toBeNull();
  });

  it("does not bounce a scorer who holds a grant", () => {
    expect(bounceTarget({ role: "SCORER", grants: ["b"] })).toBeNull();
  });

  it("does not bounce a signed-out visitor", () => {
    expect(bounceTarget(null)).toBeNull();
  });
});
