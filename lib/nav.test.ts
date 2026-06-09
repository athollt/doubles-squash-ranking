import { describe, it, expect } from "vitest";
import { adminLinksFor, navLinksFor, slugFromPathname } from "@/lib/nav";

const SLUG = "bsc-doubles-squash";

describe("slugFromPathname", () => {
  it("extracts the slug from a league path", () => {
    expect(slugFromPathname("/l/bsc-doubles-squash")).toBe("bsc-doubles-squash");
    expect(slugFromPathname("/l/bsc-doubles-squash/sessions")).toBe(
      "bsc-doubles-squash",
    );
    expect(slugFromPathname("/l/padel/admin/players")).toBe("padel");
  });

  it("returns null off a league route", () => {
    expect(slugFromPathname("/admin/users")).toBeNull();
    expect(slugFromPathname("/signin")).toBeNull();
    expect(slugFromPathname("/")).toBeNull();
  });
});

function hrefs(role: "ADMIN" | "SCORER" | undefined): string[] {
  return navLinksFor(role, SLUG).map((l) => l.href);
}

describe("navLinksFor", () => {
  it("shows only public league links when logged out", () => {
    expect(hrefs(undefined)).toEqual([
      `/l/${SLUG}`,
      `/l/${SLUG}/sessions`,
    ]);
  });

  it("adds Submit for a scorer but no admin link", () => {
    expect(hrefs("SCORER")).toEqual([
      `/l/${SLUG}`,
      `/l/${SLUG}/sessions`,
      `/l/${SLUG}/submit`,
    ]);
  });

  it("does not include admin links in the primary nav for an admin", () => {
    expect(hrefs("ADMIN")).toEqual([
      `/l/${SLUG}`,
      `/l/${SLUG}/sessions`,
      `/l/${SLUG}/submit`,
    ]);
  });
});

describe("adminLinksFor", () => {
  it("gives an admin the per-league pages plus the global Users page", () => {
    expect(adminLinksFor("ADMIN", SLUG).map((l) => l.href)).toEqual([
      `/l/${SLUG}/admin/players`,
      `/l/${SLUG}/admin/sessions`,
      `/l/${SLUG}/admin/settings`,
      "/admin/users",
    ]);
  });

  it("gives a scorer the per-league pages but not the global Users page", () => {
    expect(adminLinksFor("SCORER", SLUG).map((l) => l.href)).toEqual([
      `/l/${SLUG}/admin/players`,
      `/l/${SLUG}/admin/sessions`,
      `/l/${SLUG}/admin/settings`,
    ]);
  });
});
