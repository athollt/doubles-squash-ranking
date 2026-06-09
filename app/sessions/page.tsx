import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDefaultLeagueId } from "@/lib/league";
import { formatSessionDate } from "@/lib/session-history";
import { PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Session history — Doubles Squash @ BSC",
};

// Public, no auth (auth-rules allows /sessions). Derived view, not cached.
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const leagueId = await getDefaultLeagueId();
  const sessions = await prisma.session.findMany({
    where: { leagueId },
    orderBy: { timestamp: "desc" },
    select: {
      id: true,
      timestamp: true,
      playerCount: true,
      inferredGames: true,
      sessionPlayers: {
        orderBy: { wins: "desc" },
        select: { wins: true, player: { select: { name: true } } },
      },
    },
  });

  return (
    <PageShell title="Session history">
      {sessions.length === 0 ? (
        <p className="text-muted-foreground">No sessions recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Card className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {formatSessionDate(s.timestamp)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {s.playerCount} players · {s.inferredGames} games
                  </span>
                </div>
                {/* Player names shown inline (step 16.1) so the roster is
                    visible without opening the session. */}
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {s.sessionPlayers.map((sp, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{sp.player.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {sp.wins} won
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/sessions/${s.id}`}
                  className="text-primary mt-2 inline-block text-sm hover:underline"
                >
                  More details →
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
