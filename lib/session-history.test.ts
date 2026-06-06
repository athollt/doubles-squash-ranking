import { describe, it, expect } from "vitest";
import { formatSessionDate } from "./session-history";

describe("formatSessionDate", () => {
  it("formats a date as 'D Mon YYYY'", () => {
    expect(formatSessionDate(new Date("2026-06-05T10:00:00Z"))).toBe(
      "5 Jun 2026",
    );
  });

  it("uses UTC so the day does not shift with locale", () => {
    expect(formatSessionDate(new Date("2026-01-01T23:30:00Z"))).toBe(
      "1 Jan 2026",
    );
  });
});
