import { describe, it, expect } from "vitest";
import {
  resolveSignIn,
  resolveJwt,
  resolveSession,
  verifyCredentials,
} from "@/lib/auth-callbacks";

describe("resolveSignIn", () => {
  // ADR-014: a non-staff Google account (no User row) is now ALLOWED in — it
  // gets a role-less session and is bounced to /request-access by the landing
  // (bounceTarget). The User table stays staff-only; only sessions open up.
  it("allows a non-staff Google account (no users-table row)", async () => {
    const lookup = async () => null;
    expect(await resolveSignIn("stranger@gmail.com", "google", lookup)).toBe(
      true,
    );
  });

  it("allows a Google account whose email is in the users table", async () => {
    const lookup = async () => ({ role: "SCORER" });
    expect(await resolveSignIn("scorer@bsc.co.za", "google", lookup)).toBe(
      true,
    );
  });

  it("denies a Google sign-in with no email", async () => {
    const lookup = async () => null;
    expect(await resolveSignIn(null, "google", lookup)).toBe("/unauthorised");
  });

  // Credentials stays staff-only: a non-staff person must not get a session via
  // the password path (defence-in-depth — verifyCredentials already requires a
  // stored hash, which non-staff users never have).
  it("denies a credentials sign-in for a non-staff email", async () => {
    const lookup = async () => null;
    expect(
      await resolveSignIn("stranger@gmail.com", "credentials", lookup),
    ).toBe("/unauthorised");
  });

  it("allows a credentials sign-in for a staff email", async () => {
    const lookup = async () => ({ role: "ADMIN" });
    expect(await resolveSignIn("admin@bsc.co.za", "credentials", lookup)).toBe(
      true,
    );
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

describe("verifyCredentials", () => {
  const lookup = async (email: string) =>
    email === "admin@bsc.co.za"
      ? { email, passwordHash: "stored-hash" }
      : null;
  const verify = async (plain: string, hash: string) =>
    plain === "secret" && hash === "stored-hash";

  it("returns the user for a correct email and password", async () => {
    const result = await verifyCredentials(
      "admin@bsc.co.za",
      "secret",
      lookup,
      verify,
    );
    expect(result).toEqual({ email: "admin@bsc.co.za" });
  });

  it("returns null for a wrong password", async () => {
    const result = await verifyCredentials(
      "admin@bsc.co.za",
      "wrong",
      lookup,
      verify,
    );
    expect(result).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    const result = await verifyCredentials(
      "nobody@bsc.co.za",
      "secret",
      lookup,
      verify,
    );
    expect(result).toBeNull();
  });

  it("returns null when the user has no password set", async () => {
    const noHashLookup = async (email: string) => ({
      email,
      passwordHash: null,
    });
    const result = await verifyCredentials(
      "google-only@bsc.co.za",
      "secret",
      noHashLookup,
      verify,
    );
    expect(result).toBeNull();
  });
});
