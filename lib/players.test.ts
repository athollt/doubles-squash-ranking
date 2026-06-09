import { describe, it, expect } from "vitest";
import {
  createPlayer,
  updatePlayerName,
  updatePlayerStatus,
  resolvePlayerName,
} from "@/lib/players";
import type { PlayerStore, PlayerStatus } from "@/lib/players";

function fakeStore(overrides: Partial<PlayerStore> = {}): PlayerStore {
  return {
    findByNameInsensitive: async () => null,
    create: async (name) => ({ id: "p1", name, status: "ACTIVE" }),
    updateName: async (id, name) => ({ id, name, status: "ACTIVE" }),
    updateStatus: async (id, status) => ({ id, name: "x", status }),
    ...overrides,
  };
}

describe("createPlayer", () => {
  it("creates an active player from a valid name", async () => {
    const created: string[] = [];
    const store = fakeStore({
      create: async (name) => {
        created.push(name);
        return { id: "p1", name, status: "ACTIVE" };
      },
    });

    const result = await createPlayer("Alice", store);

    expect(result.ok).toBe(true);
    expect(created).toEqual(["Alice"]);
  });

  it("trims the name before storing it", async () => {
    const created: string[] = [];
    const store = fakeStore({
      create: async (name) => {
        created.push(name);
        return { id: "p1", name, status: "ACTIVE" };
      },
    });

    await createPlayer("  Bob  ", store);

    expect(created).toEqual(["Bob"]);
  });

  it("rejects a blank name without touching the store", async () => {
    let createCalled = false;
    const store = fakeStore({
      create: async (name) => {
        createCalled = true;
        return { id: "p1", name, status: "ACTIVE" };
      },
    });

    const result = await createPlayer("   ", store);

    expect(result.ok).toBe(false);
    expect(createCalled).toBe(false);
  });

  it("rejects a name that already exists, ignoring case", async () => {
    let createCalled = false;
    const store = fakeStore({
      findByNameInsensitive: async () => ({
        id: "existing",
        name: "Alice",
        status: "ACTIVE",
      }),
      create: async (name) => {
        createCalled = true;
        return { id: "p1", name, status: "ACTIVE" };
      },
    });

    const result = await createPlayer("alice", store);

    expect(result.ok).toBe(false);
    expect(createCalled).toBe(false);
  });
});

describe("updatePlayerName", () => {
  it("renames a player to a new valid name", async () => {
    const renames: Array<[string, string]> = [];
    const store = fakeStore({
      updateName: async (id, name) => {
        renames.push([id, name]);
        return { id, name, status: "ACTIVE" };
      },
    });

    const result = await updatePlayerName("p1", "  Carol  ", store);

    expect(result.ok).toBe(true);
    expect(renames).toEqual([["p1", "Carol"]]);
  });

  it("rejects renaming to a blank name", async () => {
    let updateCalled = false;
    const store = fakeStore({
      updateName: async (id, name) => {
        updateCalled = true;
        return { id, name, status: "ACTIVE" };
      },
    });

    const result = await updatePlayerName("p1", "  ", store);

    expect(result.ok).toBe(false);
    expect(updateCalled).toBe(false);
  });

  it("rejects renaming to another player's name", async () => {
    let updateCalled = false;
    const store = fakeStore({
      findByNameInsensitive: async () => ({
        id: "other",
        name: "Dave",
        status: "ACTIVE",
      }),
      updateName: async (id, name) => {
        updateCalled = true;
        return { id, name, status: "ACTIVE" };
      },
    });

    const result = await updatePlayerName("p1", "dave", store);

    expect(result.ok).toBe(false);
    expect(updateCalled).toBe(false);
  });

  it("allows a player to keep its own name (case-only change)", async () => {
    const store = fakeStore({
      findByNameInsensitive: async () => ({
        id: "p1",
        name: "Erin",
        status: "ACTIVE",
      }),
    });

    const result = await updatePlayerName("p1", "ERIN", store);

    expect(result.ok).toBe(true);
  });
});

describe("resolvePlayerName", () => {
  it("reuses an existing player matching the name (case-insensitive) — no duplicate", async () => {
    let createCalled = false;
    const store = fakeStore({
      findByNameInsensitive: async () => ({
        id: "existing",
        name: "Sarah",
        status: "ACTIVE",
      }),
      create: async (name) => {
        createCalled = true;
        return { id: "new", name, status: "ACTIVE" };
      },
    });

    const result = await resolvePlayerName("sarah", store);

    expect(result).toEqual({ ok: true, playerId: "existing" });
    expect(createCalled).toBe(false);
  });

  it("creates a new player when the name is unused", async () => {
    const created: string[] = [];
    const store = fakeStore({
      create: async (name) => {
        created.push(name);
        return { id: "new", name, status: "ACTIVE" };
      },
    });

    const result = await resolvePlayerName("  Newbie  ", store);

    expect(result).toEqual({ ok: true, playerId: "new" });
    expect(created).toEqual(["Newbie"]);
  });

  it("rejects a blank name without touching the store", async () => {
    let touched = false;
    const store = fakeStore({
      findByNameInsensitive: async () => {
        touched = true;
        return null;
      },
      create: async (name) => {
        touched = true;
        return { id: "new", name, status: "ACTIVE" };
      },
    });

    const result = await resolvePlayerName("   ", store);

    expect(result.ok).toBe(false);
    expect(touched).toBe(false);
  });
});

describe("updatePlayerStatus", () => {
  it("removes an active player", async () => {
    const calls: Array<[string, PlayerStatus]> = [];
    const store = fakeStore({
      updateStatus: async (id, status) => {
        calls.push([id, status]);
        return { id, name: "Frank", status };
      },
    });

    const result = await updatePlayerStatus("p1", "REMOVED", store);

    expect(result.ok).toBe(true);
    expect(calls).toEqual([["p1", "REMOVED"]]);
  });

  it("reactivates a removed player", async () => {
    const calls: Array<[string, PlayerStatus]> = [];
    const store = fakeStore({
      updateStatus: async (id, status) => {
        calls.push([id, status]);
        return { id, name: "Frank", status };
      },
    });

    const result = await updatePlayerStatus("p1", "ACTIVE", store);

    expect(result.ok).toBe(true);
    expect(calls).toEqual([["p1", "ACTIVE"]]);
  });
});
