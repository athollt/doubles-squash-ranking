import { describe, expect, it } from "vitest";
import manifest from "./manifest.json";

// Behaviour 1: the manifest declares the fields the spec requires, now branded
// as Rungs (step 24) — single shared PWA identity (ADR-013), slate/indigo palette.
describe("manifest.json", () => {
  it("has the required PWA fields", () => {
    expect(manifest.name).toBe("Rungs");
    expect(manifest.short_name).toBe("Rungs");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    // Rungs palette (step 24): indigo primary + slate background.
    expect(manifest.theme_color).toBe("#4F46E5");
    expect(manifest.background_color).toBe("#F8FAFC");
  });

  it("declares the 192 and 512 PNG icons", () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    for (const icon of manifest.icons) {
      expect(icon.type).toBe("image/png");
      expect(icon.src).toMatch(/^\/icon-\d+\.png$/);
    }
  });
});
