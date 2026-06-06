import { describe, it, expect } from "vitest";
import { adminLinks, navLinksFor } from "@/lib/nav";

function hrefs(role: "ADMIN" | "SCORER" | undefined): string[] {
  return navLinksFor(role).map((l) => l.href);
}

describe("navLinksFor", () => {
  it("shows only public links when logged out", () => {
    expect(hrefs(undefined)).toEqual(["/", "/sessions"]);
  });

  it("adds Submit for a scorer but no admin link", () => {
    expect(hrefs("SCORER")).toEqual(["/", "/sessions", "/submit"]);
  });

  it("does not include admin links in the primary nav for an admin", () => {
    // Admin pages live in their own dropdown (adminLinks), not the main row.
    expect(hrefs("ADMIN")).toEqual(["/", "/sessions", "/submit"]);
  });
});

describe("adminLinks", () => {
  it("lists every admin page", () => {
    expect(adminLinks.map((l) => l.href)).toEqual([
      "/admin/players",
      "/admin/sessions",
      "/admin/settings",
      "/admin/users",
    ]);
  });
});
