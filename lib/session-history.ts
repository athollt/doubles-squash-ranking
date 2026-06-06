// Pure presentation helpers for the public session history pages (step 10).

// Format a session date "nicely", e.g. "5 Jun 2026" (PRD § Historical Views).
// Uses UTC so it matches the stored timestamp regardless of server locale.
export function formatSessionDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
