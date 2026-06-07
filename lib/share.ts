// Pure builder for the "share result to WhatsApp" text (step 16.4). Framework-free
// so it is trivially testable; the Web Share API call lives in the client form.

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
