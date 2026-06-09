import { describe, it, expect } from "vitest";
import {
  createLeague,
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
    findUserByEmail: async () => null,
    createUser: async (email, name) => ({ id: "new-user", email, name }),
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

describe("assignScorer", () => {
  it("creates the user (allowlist) then grants the league when the email is new", async () => {
    const events: string[] = [];
    const store = makeStore({
      findUserByEmail: async () => null,
      createUser: async (email, name) => {
        events.push(`create:${email}`);
        return { id: "u-new", email, name };
      },
      grant: async (userId, leagueId) => {
        events.push(`grant:${userId}:${leagueId}`);
      },
    });

    const r = await assignScorer(
      { email: "new@club.test", name: "New Scorer", leagueId: "L1" },
      store,
    );

    expect(r.ok).toBe(true);
    expect(events).toEqual(["create:new@club.test", "grant:u-new:L1"]);
  });

  it("grants the league without creating a user when the email already exists", async () => {
    const events: string[] = [];
    const store = makeStore({
      findUserByEmail: async () => ({
        id: "u-existing",
        email: "scorer@club.test",
        name: "Existing",
      }),
      createUser: async (email, name) => {
        events.push(`create:${email}`);
        return { id: "x", email, name };
      },
      grant: async (userId, leagueId) => {
        events.push(`grant:${userId}:${leagueId}`);
      },
    });

    const r = await assignScorer(
      { email: "scorer@club.test", name: "Existing", leagueId: "L1" },
      store,
    );

    expect(r.ok).toBe(true);
    expect(events).toEqual(["grant:u-existing:L1"]);
  });

  it("rejects an invalid email", async () => {
    const r = await assignScorer(
      { email: "not-an-email", name: "X", leagueId: "L1" },
      makeStore(),
    );
    expect(r.ok).toBe(false);
  });
});
