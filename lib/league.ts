import { prisma } from "@/lib/prisma";

// Transitional single-League resolver (step 19). Until /l/{slug} routing lands
// (step 21), there is exactly one League — the adopted BSC ladder — and every
// page/action scopes to it. Step 21 replaces callers with a slug→leagueId lookup
// off the route; this helper then goes away (or becomes the landing default).
export async function getDefaultLeagueId(): Promise<string> {
  const league = await prisma.league.findFirstOrThrow({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return league.id;
}
