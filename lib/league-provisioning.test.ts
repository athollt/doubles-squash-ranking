import { describe, it, expect } from "vitest";
import {
  createLeague,
  updateLeague,
  assignScorer,
  type LeagueProvisioningStore,
} from "@/lib/league-provisioning";

function makeStore(
  over: Partial<LeagueProvisioningStore> = {},
): LeagueProvisioningStore {
  return {
    slugTaken: async () => false,
    createLeagueWithSettings: async (input) => ({
      id: "new-league",
      slug: input.slug,
      displayName: input.displayName,
    }),
    updateLeagueDetails: async (id, input) => ({
      id,
      slug: "unchanged-slug",
      displayName: input.displayName,
    }),
    grant: async () => {},
    ...over,
  };
}

describe("createLeague", () => {
  it("creates a league + seeds its settings for a valid input", async () => {
    let seeded = false;
    const store = makeStore({
      createLeagueWithSettings: async (input) => {
        seeded = true;
        return { id: "L1", slug: input.slug, displayName: input.displayName };
      },
    });

    const r = await createLeague(
      { name: "Padel Tuesdays", displayName: "Padel Tuesdays", slug: "padel-tuesdays" },
      store,
    );

    expect(r.ok).toBe(true);
    expect(seeded).toBe(true);
    if (r.ok) expect(r.league.slug).toBe("padel-tuesdays");
  });

  it("rejects a duplicate slug without creating anything", async () => {
    let created = false;
    const store = makeStore({
      slugTaken: async () => true,
      createLeagueWithSettings: async (input) => {
        created = true;
        return { id: "L1", slug: input.slug, displayName: input.displayName };
      },
    });

    const r = await createLeague(
      { name: "BSC", displayName: "BSC", slug: "bsc-doubles-squash" },
      store,
    );

    expect(r.ok).toBe(false);
    expect(created).toBe(false);
  });

  it("rejects a blank name and a malformed slug", async () => {
    const store = makeStore();
    expect((await createLeague({ name: "  ", displayName: "x", slug: "ok" }, store)).ok).toBe(
      false,
    );
    expect(
      (await createLeague({ name: "X", displayName: "X", slug: "Bad Slug" }, store)).ok,
    ).toBe(false);
  });
});

describe("updateLeague", () => {
  it("updates name + displayName (slug is never touched)", async () => {
    let updatedWith: { name: string; displayName: string } | null = null;
    const store = makeStore({
      updateLeagueDetails: async (id, input) => {
        updatedWith = input;
        return { id, slug: "padel-tuesdays", displayName: input.displayName };
      },
    });

    const r = await updateLeague(
      "L1",
      { name: "Padel Weds", displayName: "Padel Wednesdays" },
      store,
    );

    expect(r.ok).toBe(true);
    expect(updatedWith).toEqual({ name: "Padel Weds", displayName: "Padel Wednesdays" });
  });

  it("rejects a blank name or display name", async () => {
    const store = makeStore();
    expect((await updateLeague("L1", { name: " ", displayName: "X" }, store)).ok).toBe(
      false,
    );
    expect((await updateLeague("L1", { name: "X", displayName: " " }, store)).ok).toBe(
      false,
    );
  });
});

describe("assignScorer", () => {
  it("grants an existing scorer the chosen league", async () => {
    const events: string[] = [];
    const store = makeStore({
      grant: async (userId, leagueId) => {
        events.push(`grant:${userId}:${leagueId}`);
      },
    });

    const r = await assignScorer({ userId: "u1", leagueId: "L1" }, store);

    expect(r.ok).toBe(true);
    expect(events).toEqual(["grant:u1:L1"]);
  });

  it("rejects a missing scorer or league", async () => {
    expect((await assignScorer({ userId: "", leagueId: "L1" }, makeStore())).ok).toBe(
      false,
    );
    expect((await assignScorer({ userId: "u1", leagueId: "" }, makeStore())).ok).toBe(
      false,
    );
  });
});
