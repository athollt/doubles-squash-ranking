import { describe, it, expect } from "vitest";
import {
  resolveSignIn,
  resolveJwt,
  resolveSession,
} from "@/lib/auth-callbacks";

describe("resolveSignIn", () => {
  it("denies a Google account whose email is not in the users table", async () => {
    const lookup = async () => null;
    expect(await resolveSignIn("stranger@gmail.com", lookup)).toBe(
      "/unauthorised",
    );
  });

  it("allows a Google account whose email is in the users table", async () => {
    const lookup = async () => ({ role: "SCORER" });
    expect(await resolveSignIn("scorer@bsc.co.za", lookup)).toBe(true);
  });
});

describe("resolveJwt", () => {
  it("attaches the user's role to the token on first sign-in", async () => {
    const lookup = async () => ({ role: "ADMIN" });
    const token = await resolveJwt(
      {},
      { email: "admin@bsc.co.za" },
      lookup,
    );
    expect(token.role).toBe("ADMIN");
  });

  it("leaves an existing token untouched on subsequent requests", async () => {
    const lookup = async () => {
      throw new Error("lookup must not run without a fresh user");
    };
    const token = await resolveJwt({ role: "SCORER" }, undefined, lookup);
    expect(token.role).toBe("SCORER");
  });
});

describe("resolveSession", () => {
  it("exposes the token's role on the session", () => {
    const session = resolveSession({ user: { email: "a@bsc.co.za" } }, {
      role: "ADMIN",
    });
    expect(session.role).toBe("ADMIN");
  });
});
