import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type Role } from "@/lib/nav";
import { AdminMenu } from "@/components/admin-menu";
import { SignInButton } from "@/components/sign-in-button";
import { AccountMenu } from "@/components/account-menu";
import { SiteWordmark } from "@/components/site-wordmark";

// Slim sticky top bar (step 13.5). Server Component: reads the session for the auth
// control + Admin menu. Primary navigation (Ladder/Sessions/Submit) lives in the
// BottomNav tab bar now, not here — this bar carries identity + account only.
export async function SiteHeader() {
  const session = await auth();
  const role = session?.role as Role | undefined;

  // The slug→name map for the wordmark, which switches to the current League's
  // name on a /l/{slug} route. Resolved client-side (usePathname) so it updates
  // on every navigation; the map is small (one row per league).
  const leagues = await prisma.league.findMany({
    select: { slug: true, displayName: true },
  });
  const leagueNames = Object.fromEntries(
    leagues.map((l) => [l.slug, l.displayName]),
  );

  return (
    <header className="bg-background/80 border-border sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
        <SiteWordmark leagueNames={leagueNames} />
        <div className="ml-auto flex items-center gap-3">
          {role && <AdminMenu role={role} />}
          {session?.user ? (
            <AccountMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
            />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
