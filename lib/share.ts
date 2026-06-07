// Pure builder for the "share result to WhatsApp" text (step 16.4). Framework-free
// so it is trivially testable; the Web Share API call lives in the client form.

export interface ShareRosterEntry {
  name: string;
  wins: number;
}

// "Doubles @ BSC — 7 Jun" header, then "Name wins, …" in the given order, then the
// public ladder link. Date in UTC (matches the stored timestamp regardless of
// locale, like formatSessionDate).
export function buildShareText({
  roster,
  date,
  ladderUrl,
}: {
  roster: ShareRosterEntry[];
  date: Date;
  ladderUrl: string;
}): string {
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
  const line = roster.map((r) => `${r.name} ${r.wins}`).join(", ");
  return `Doubles @ BSC — ${day}\n\n${line}\n\nLadder: ${ladderUrl}`;
}
