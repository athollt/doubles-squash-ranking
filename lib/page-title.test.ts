import { describe, it, expect } from "vitest";
import { leaguePageTitle } from "@/lib/page-title";

describe("leaguePageTitle", () => {
  it("renders the page label with the league's display name", () => {
    expect(leaguePageTitle("Ladder", "Doubles Squash @ BSC")).toBe(
      "Ladder — Doubles Squash @ BSC",
    );
  });

  it("uses whatever league name is supplied (not a hard-coded brand)", () => {
    expect(leaguePageTitle("Session history", "Padel Tuesdays @ BSC")).toBe(
      "Session history — Padel Tuesdays @ BSC",
    );
  });
});
