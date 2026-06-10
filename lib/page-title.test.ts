import { describe, it, expect } from "vitest";
import { leaguePageTitle } from "@/lib/page-title";

describe("leaguePageTitle", () => {
  it("leads with the Rungs brand, then the league's display name", () => {
    expect(leaguePageTitle("Doubles Squash @ BSC")).toBe(
      "Rungs - Doubles Squash @ BSC",
    );
  });

  it("uses whatever league name is supplied", () => {
    expect(leaguePageTitle("Padel Tuesdays @ BSC")).toBe(
      "Rungs - Padel Tuesdays @ BSC",
    );
  });
});
