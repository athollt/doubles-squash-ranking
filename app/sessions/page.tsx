import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSessionDate } from "@/lib/session-history";

export const metadata = {
  title: "Session history — Doubles Squash @ BSC",
};

// Public, no auth (auth-rules allows /sessions). Derived view, not cached.
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = await prisma.session.findMany({
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
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Session history</h1>

      {sessions.length === 0 ? (
        <p className="text-zinc-500">No sessions recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id} className="rounded border p-3">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="font-medium">
                    {formatSessionDate(s.timestamp)}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {s.playerCount} players · {s.inferredGames} games
                  </span>
                </summary>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {s.sessionPlayers.map((sp, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{sp.player.name}</span>
                      <span className="tabular-nums text-zinc-500">
                        {sp.wins} won
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/sessions/${s.id}`}
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  View full detail →
                </Link>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
