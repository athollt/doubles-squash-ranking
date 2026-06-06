import { describe, it, expect } from "vitest";
import { validateSettings } from "@/lib/settings";

describe("validateSettings", () => {
  it("rejects a non-positive value", () => {
    const result = validateSettings([
      { key: "KFactor", value: 160 },
      { key: "StartingRating", value: -5 },
    ]);
    expect(result.ok).toBe(false);
  });

  it("rejects a non-numeric (NaN) value", () => {
    const result = validateSettings([{ key: "KFactor", value: Number.NaN }]);
    expect(result.ok).toBe(false);
  });

  it("accepts all-positive values and returns them", () => {
    const updates = [
      { key: "KFactor", value: 160 },
      { key: "StartingRating", value: 1000 },
    ];
    const result = validateSettings(updates);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.updates).toEqual(updates);
  });
});
