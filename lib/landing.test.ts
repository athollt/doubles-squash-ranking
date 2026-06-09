import { describe, it, expect } from "vitest";
import { visibleLeaguesFor, type LeagueListItem } from "@/lib/landing";

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

  it("shows a scorer with no grants nothing", () => {
    expect(visibleLeaguesFor({ role: "SCORER", grants: [] }, ALL)).toEqual([]);
  });

  it("shows a signed-out visitor every league (public ladders are browsable)", () => {
    expect(visibleLeaguesFor(null, ALL).map((l) => l.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
