// Pure builder for the "share result to WhatsApp" text (step 16.4). Framework-free
// so it is trivially testable; the Web Share API call lives in the client form.

// Absolute public ladder URL for a league (ADR-009/013): the deploy origin
// (AUTH_URL) + the per-league /l/{slug} path. Embedded in the share text and the
// slug's immutability is what keeps these links stable.
export function ladderUrlForSlug(slug: string): string {
  const base = (process.env.AUTH_URL ?? "https://app.rungs.co.za").replace(
    /\/+$/,
    "",
  );
  return `${base}/l/${slug}`;
}

export interface ShareRosterEntry {
  name: string;
  wins: number;
}

// The session notes (if any) on the first line; then "Scores: Name wins, …" in
// the given order; then the public ladder link. Sessions are captured on the day,
// so no date/header line. Notes are optional — a blank/absent value drops the line.
export function buildShareText({
  roster,
  ladderUrl,
  notes,
}: {
  roster: ShareRosterEntry[];
  ladderUrl: string;
  notes?: string;
}): string {
  const scores = roster.map((r) => `${r.name} ${r.wins}`).join(", ");
  const notesLine = notes?.trim() ? `${notes.trim()}\n` : "";
  return `${notesLine}Scores: ${scores}\nLadder: ${ladderUrl}`;
}
