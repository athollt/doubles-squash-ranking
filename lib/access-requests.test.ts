import { describe, it, expect } from "vitest";
import {
  requestAccess,
  approveAccessRequest,
  dismissAccessRequest,
  type AccessRequestStore,
} from "@/lib/access-requests";

type Created = {
  email: string;
  name: string;
  leagueId: string | null;
  notes: string | null;
};

// A fake store records what the pure orchestrator asks of it. Leagues are a
// fixed set; pending requests accumulate so duplicate detection is exercised.
function fakeStore(opts?: {
  leagueIds?: string[];
  pending?: { email: string; leagueId: string | null }[];
}): AccessRequestStore & { created: Created[] } {
  const leagues = new Set(opts?.leagueIds ?? ["bsc"]);
  const pending = opts?.pending ?? [];
  const created: Created[] = [];
  return {
    created,
    leagueExists: async (id) => leagues.has(id),
    pendingExists: async (email, leagueId) =>
      pending.some(
        (p) =>
          p.email.toLowerCase() === email.toLowerCase() &&
          p.leagueId === leagueId,
      ),
    createPending: async (input) => {
      created.push(input);
    },
  };
}

describe("requestAccess", () => {
  it("writes a pending scorer request for the chosen league", async () => {
    const store = fakeStore({ leagueIds: ["bsc"] });
    const result = await requestAccess(
      { email: "ann@gmail.com", name: "Ann", leagueId: "bsc", notes: "I help on Tuesdays" },
      store,
    );
    expect(result.ok).toBe(true);
    expect(store.created).toEqual([
      { email: "ann@gmail.com", name: "Ann", leagueId: "bsc", notes: "I help on Tuesdays" },
    ]);
  });

  it("writes a pending NEW-league request (no league) with notes", async () => {
    const store = fakeStore({ leagueIds: ["bsc"] });
    const result = await requestAccess(
      {
        email: "ann@gmail.com",
        name: "Ann",
        leagueId: null,
        notes: "Padel league at Westville, ~12 players",
      },
      store,
    );
    expect(result.ok).toBe(true);
    expect(store.created).toEqual([
      {
        email: "ann@gmail.com",
        name: "Ann",
        leagueId: null,
        notes: "Padel league at Westville, ~12 players",
      },
    ]);
  });

  it("rejects an unknown league (no request written)", async () => {
    const store = fakeStore({ leagueIds: ["bsc"] });
    const result = await requestAccess(
      { email: "ann@gmail.com", name: "Ann", leagueId: "nope", notes: "" },
      store,
    );
    expect(result.ok).toBe(false);
    expect(store.created).toEqual([]);
  });

  it("does not write a duplicate pending request for the same email + league", async () => {
    const store = fakeStore({
      leagueIds: ["bsc"],
      pending: [{ email: "ann@gmail.com", leagueId: "bsc" }],
    });
    const result = await requestAccess(
      { email: "ann@gmail.com", name: "Ann", leagueId: "bsc", notes: "" },
      store,
    );
    expect(result.ok).toBe(false);
    expect(store.created).toEqual([]);
  });

  it("stores empty notes as null", async () => {
    const store = fakeStore({ leagueIds: ["bsc"] });
    await requestAccess(
      { email: "ann@gmail.com", name: "Ann", leagueId: "bsc", notes: "   " },
      store,
    );
    expect(store.created[0].notes).toBeNull();
  });
});

// Approve/dismiss act on an existing request. A fake review store records the
// grant, any user creation, and the status it set.
type Review = {
  request: {
    id: string;
    email: string;
    name: string;
    leagueId: string | null;
  } | null;
  existingUserId?: string;
};
function fakeReviewStore(r: Review) {
  const calls = {
    createdUser: null as { email: string; name: string } | null,
    granted: null as { userId: string; leagueId: string } | null,
    status: null as { id: string; status: string } | null,
  };
  const store: AccessRequestStore = {
    leagueExists: async () => true,
    pendingExists: async () => false,
    createPending: async () => {},
    findPendingRequest: async (id) => (r.request?.id === id ? r.request : null),
    findUserByEmail: async () =>
      r.existingUserId ? { id: r.existingUserId } : null,
    createScorerUser: async (email, name) => {
      calls.createdUser = { email, name };
      return { id: "new-user" };
    },
    grant: async (userId, leagueId) => {
      calls.granted = { userId, leagueId };
    },
    setStatus: async (id, status) => {
      calls.status = { id, status };
    },
  };
  return { store, calls };
}

describe("approveAccessRequest", () => {
  const request = {
    id: "req1",
    email: "ann@gmail.com",
    name: "Ann",
    leagueId: "bsc",
  };

  it("creates the user (if absent) and grant, and marks the request approved", async () => {
    const { store, calls } = fakeReviewStore({ request });
    const result = await approveAccessRequest("req1", store);
    expect(result.ok).toBe(true);
    expect(calls.createdUser).toEqual({ email: "ann@gmail.com", name: "Ann" });
    expect(calls.granted).toEqual({ userId: "new-user", leagueId: "bsc" });
    expect(calls.status).toEqual({ id: "req1", status: "APPROVED" });
  });

  it("grants an existing user without creating a new account", async () => {
    const { store, calls } = fakeReviewStore({
      request,
      existingUserId: "existing",
    });
    const result = await approveAccessRequest("req1", store);
    expect(result.ok).toBe(true);
    expect(calls.createdUser).toBeNull();
    expect(calls.granted).toEqual({ userId: "existing", leagueId: "bsc" });
    expect(calls.status).toEqual({ id: "req1", status: "APPROVED" });
  });

  it("rejects an unknown / non-pending request (no grant, no status change)", async () => {
    const { store, calls } = fakeReviewStore({ request: null });
    const result = await approveAccessRequest("missing", store);
    expect(result.ok).toBe(false);
    expect(calls.granted).toBeNull();
    expect(calls.status).toBeNull();
  });

  it("marks a new-league request (no league) approved without creating a user or grant", async () => {
    const { store, calls } = fakeReviewStore({
      request: { id: "req2", email: "ann@gmail.com", name: "Ann", leagueId: null },
    });
    const result = await approveAccessRequest("req2", store);
    expect(result.ok).toBe(true);
    expect(calls.createdUser).toBeNull();
    expect(calls.granted).toBeNull();
    expect(calls.status).toEqual({ id: "req2", status: "APPROVED" });
  });
});

describe("dismissAccessRequest", () => {
  const request = {
    id: "req1",
    email: "ann@gmail.com",
    name: "Ann",
    leagueId: "bsc",
  };

  it("marks the request dismissed and creates no grant", async () => {
    const { store, calls } = fakeReviewStore({ request });
    const result = await dismissAccessRequest("req1", store);
    expect(result.ok).toBe(true);
    expect(calls.granted).toBeNull();
    expect(calls.createdUser).toBeNull();
    expect(calls.status).toEqual({ id: "req1", status: "DISMISSED" });
  });

  it("rejects an unknown / non-pending request", async () => {
    const { store, calls } = fakeReviewStore({ request: null });
    const result = await dismissAccessRequest("missing", store);
    expect(result.ok).toBe(false);
    expect(calls.status).toBeNull();
  });
});
