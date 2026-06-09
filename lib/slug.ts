// Slug lifecycle helpers (ADR-013). A slug is the URL-safe league identifier in
// /l/{slug}: lowercase, alphanumeric words joined by single hyphens. Suggested
// from the league name, editable at creation, then immutable (changing it would
// break shared/bookmarked ladder links — ADR-009's share text embeds the URL).

// Slugify a league name: lowercase, strip non-alphanumerics to hyphens, collapse
// runs, trim ends. Returns "" if nothing slug-able remains (caller validates).
export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    // Drop apostrophes so "Tom's" → "toms" rather than splitting on them.
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A valid slug: one or more lowercase-alphanumeric groups joined by single
// hyphens (no leading/trailing/doubled hyphens, no other characters).
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export type SlugValidation = { ok: true } | { ok: false; error: string };

// Validate a slug chosen at league creation: correct format and not already in
// use. Pure — the caller supplies `taken` from a uniqueness lookup. Slugs are
// immutable after creation (ADR-013), so this only guards creation.
export function validateNewSlug(
  slug: string,
  { taken }: { taken: boolean },
): SlugValidation {
  if (!isValidSlug(slug)) {
    return {
      ok: false,
      error:
        "Slug must be lowercase letters, numbers and single hyphens (e.g. bsc-doubles-squash).",
    };
  }
  if (taken) {
    return { ok: false, error: "That slug is already in use." };
  }
  return { ok: true };
}
