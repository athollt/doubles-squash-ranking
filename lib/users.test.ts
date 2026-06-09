import { describe, it, expect } from "vitest";
import {
  createUser,
  updateUserRole,
  updateUserName,
  deleteUser,
} from "@/lib/users";
import type { UserStore, UserRecord, Role } from "@/lib/users";

function fakeStore(overrides: Partial<UserStore> = {}): UserStore {
  return {
    findByEmailInsensitive: async () => null,
    findById: async () => null,
    countAdmins: async () => 2,
    create: async (email, name, role) => ({ id: "u1", email, name, role }),
    updateRole: async (id, role) => ({ id, email: "x@y.z", name: "X", role }),
    updateName: async (id, name) => ({ id, email: "x@y.z", name, role: "SCORER" }),
    delete: async () => {},
    ...overrides,
  };
}

const admin: UserRecord = {
  id: "a1",
  email: "admin@bsc.local",
  name: "Admin",
  role: "ADMIN",
};

describe("createUser", () => {
  it("adds a new user with the Scorer role (behaviour 1)", async () => {
    const created: Role[] = [];
    const store = fakeStore({
      create: async (email, name, role) => {
        created.push(role);
        return { id: "u1", email, name, role };
      },
    });
    const result = await createUser("bob@bsc.local", "Bob", "SCORER", store);
    expect(result.ok).toBe(true);
    expect(created).toEqual(["SCORER"]);
  });

  it("adds a new user with the Admin role (behaviour 2)", async () => {
    const result = await createUser("cara@bsc.local", "Cara", "ADMIN", fakeStore());
    expect(result).toMatchObject({ ok: true, user: { role: "ADMIN" } });
  });

  it("trims the email and name", async () => {
    const store = fakeStore({
      create: async (email, name, role) => ({ id: "u1", email, name, role }),
    });
    const result = await createUser("  d@bsc.local  ", "  Dee  ", "SCORER", store);
    expect(result).toMatchObject({
      ok: true,
      user: { email: "d@bsc.local", name: "Dee" },
    });
  });

  it("rejects a duplicate email (behaviour 7)", async () => {
    const store = fakeStore({ findByEmailInsensitive: async () => admin });
    const result = await createUser("admin@bsc.local", "Dup", "SCORER", store);
    expect(result).toEqual({
      ok: false,
      error: "A user with that email already exists.",
    });
  });

  it("rejects an invalid email format (behaviour 8)", async () => {
    const result = await createUser("not-an-email", "Bad", "SCORER", fakeStore());
    expect(result).toEqual({ ok: false, error: "A valid email is required." });
  });

  it("rejects an empty name", async () => {
    const result = await createUser("e@bsc.local", "   ", "SCORER", fakeStore());
    expect(result).toEqual({ ok: false, error: "Name is required." });
  });
});

describe("updateUserRole", () => {
  it("changes a role from Scorer to Admin (behaviour 3)", async () => {
    const updates: Array<[string, Role]> = [];
    const store = fakeStore({
      updateRole: async (id, role) => {
        updates.push([id, role]);
        return { id, email: "x@y.z", name: "X", role };
      },
    });
    const result = await updateUserRole("u1", "ADMIN", store);
    expect(result.ok).toBe(true);
    expect(updates).toEqual([["u1", "ADMIN"]]);
  });
});

describe("updateUserName", () => {
  it("trims the name and updates it (behaviour 2)", async () => {
    const updates: Array<[string, string]> = [];
    const store = fakeStore({
      updateName: async (id, name) => {
        updates.push([id, name]);
        return { id, email: "x@y.z", name, role: "SCORER" };
      },
    });
    const result = await updateUserName("u1", "  New Name  ", store);
    expect(result).toMatchObject({ ok: true, user: { name: "New Name" } });
    expect(updates).toEqual([["u1", "New Name"]]);
  });

  it("rejects an empty name (behaviour 1)", async () => {
    const store = fakeStore({
      updateName: async () => {
        throw new Error("should not update");
      },
    });
    const result = await updateUserName("u1", "   ", store);
    expect(result).toEqual({ ok: false, error: "Name is required." });
  });
});

describe("deleteUser", () => {
  it("deletes a scorer (behaviour 4)", async () => {
    const deleted: string[] = [];
    const store = fakeStore({
      findById: async (id) => ({ id, email: "s@bsc.local", name: "S", role: "SCORER" }),
      delete: async (id) => {
        deleted.push(id);
      },
    });
    const result = await deleteUser("u2", "a1", store);
    expect(result).toEqual({ ok: true });
    expect(deleted).toEqual(["u2"]);
  });

  it("refuses to delete yourself (behaviour 5)", async () => {
    const store = fakeStore({
      delete: async () => {
        throw new Error("should not delete");
      },
    });
    const result = await deleteUser("a1", "a1", store);
    expect(result).toEqual({ ok: false, error: "You cannot remove yourself." });
  });

  it("refuses to delete the last admin (behaviour 6)", async () => {
    const store = fakeStore({
      findById: async (id) => ({ ...admin, id }),
      countAdmins: async () => 1,
      delete: async () => {
        throw new Error("should not delete");
      },
    });
    const result = await deleteUser("a2", "a1", store);
    expect(result).toEqual({ ok: false, error: "Cannot remove the last admin." });
  });

  it("allows deleting an admin when others remain", async () => {
    const deleted: string[] = [];
    const store = fakeStore({
      findById: async (id) => ({ ...admin, id }),
      countAdmins: async () => 2,
      delete: async (id) => {
        deleted.push(id);
      },
    });
    const result = await deleteUser("a2", "a1", store);
    expect(result).toEqual({ ok: true });
    expect(deleted).toEqual(["a2"]);
  });
});
