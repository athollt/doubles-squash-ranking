import { describe, it, expect } from "vitest";
import { navLinksFor } from "@/lib/nav";

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

  it("adds the admin link for an admin", () => {
    expect(hrefs("ADMIN")).toEqual([
      "/",
      "/sessions",
      "/submit",
      "/admin/players",
    ]);
  });
});
