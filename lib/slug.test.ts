import { describe, it, expect } from "vitest";
import { suggestSlug, isValidSlug, validateNewSlug } from "@/lib/slug";

// Slug lifecycle (ADR-013): suggested from the league name, URL-safe, immutable
// after creation. These are the pure helpers; the creation form is step 22.
describe("suggestSlug", () => {
  it("slugifies a league name to lowercase hyphenated form", () => {
    expect(suggestSlug("BSC Doubles Squash")).toBe("bsc-doubles-squash");
  });

  it("collapses runs of separators and trims leading/trailing ones", () => {
    expect(suggestSlug("  Foo   Bar--Baz  ")).toBe("foo-bar-baz");
  });

  it("strips characters that are not URL-safe", () => {
    expect(suggestSlug("Tom's Club & Co. (2026)!")).toBe("toms-club-co-2026");
  });

  it("returns an empty string for a name with no slug-able characters", () => {
    expect(suggestSlug("   ---  ")).toBe("");
    expect(suggestSlug("!!!")).toBe("");
  });
});

describe("isValidSlug", () => {
  it("accepts a well-formed slug", () => {
    expect(isValidSlug("bsc-doubles-squash")).toBe(true);
    expect(isValidSlug("padel2026")).toBe(true);
  });

  it("rejects empty, uppercase, leading/trailing or doubled hyphens, and bad chars", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("BSC")).toBe(false);
    expect(isValidSlug("-bsc")).toBe(false);
    expect(isValidSlug("bsc-")).toBe(false);
    expect(isValidSlug("bsc--doubles")).toBe(false);
    expect(isValidSlug("bsc squash")).toBe(false);
    expect(isValidSlug("bsc/squash")).toBe(false);
  });
});

describe("validateNewSlug", () => {
  it("accepts a well-formed, unused slug", () => {
    expect(validateNewSlug("padel-night", { taken: false })).toEqual({ ok: true });
  });

  it("rejects a badly-formatted slug with a format error", () => {
    const r = validateNewSlug("Bad Slug", { taken: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/format|lowercase|hyphen/i);
  });

  it("rejects an empty slug", () => {
    expect(validateNewSlug("", { taken: false }).ok).toBe(false);
  });

  it("rejects an already-taken slug", () => {
    const r = validateNewSlug("bsc-doubles-squash", { taken: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/taken|already|use/i);
  });
});
