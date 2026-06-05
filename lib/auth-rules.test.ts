import { describe, it, expect } from "vitest";
import { authorizeRoute } from "@/lib/auth-rules";

describe("authorizeRoute", () => {
  it("redirects an unauthenticated visitor away from /submit to sign-in", () => {
    expect(authorizeRoute("/submit", null)).toBe("signin");
  });

  it("allows an unauthenticated visitor to view the public ladder at /", () => {
    expect(authorizeRoute("/", null)).toBe("allow");
  });

  it("allows an unauthenticated visitor to view the public session history at /sessions", () => {
    expect(authorizeRoute("/sessions", null)).toBe("allow");
  });

  it("allows an unauthenticated visitor to view a public session detail page", () => {
    expect(authorizeRoute("/sessions/42", null)).toBe("allow");
  });

  it("allows an unauthenticated visitor to view a public player trend page", () => {
    expect(authorizeRoute("/players/7", null)).toBe("allow");
  });

  it("redirects an unauthenticated visitor away from a session edit page to sign-in", () => {
    expect(authorizeRoute("/sessions/42/edit", null)).toBe("signin");
  });

  it("allows an authenticated scorer to access /submit", () => {
    expect(authorizeRoute("/submit", { role: "SCORER" })).toBe("allow");
  });

  it("denies an authenticated scorer access to an admin route", () => {
    expect(authorizeRoute("/admin/players", { role: "SCORER" })).toBe(
      "unauthorised",
    );
  });

  it("allows an authenticated admin to access an admin route", () => {
    expect(authorizeRoute("/admin/players", { role: "ADMIN" })).toBe("allow");
  });

  it("allows the auth API routes through without a session", () => {
    expect(authorizeRoute("/api/auth/signin", null)).toBe("allow");
  });
});
