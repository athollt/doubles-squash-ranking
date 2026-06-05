import { describe, expect, it } from "vitest";
import manifest from "./manifest.json";

// Behaviour 1: the manifest declares the fields the spec (step 13) requires.
describe("manifest.json", () => {
  it("has the required PWA fields", () => {
    expect(manifest.name).toBe("BSC Squash Ladder");
    expect(manifest.short_name).toBe("Squash");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#1a1a1a");
    expect(manifest.background_color).toBe("#ffffff");
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
