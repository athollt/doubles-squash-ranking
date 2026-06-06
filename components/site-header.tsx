import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { type Role } from "@/lib/nav";
import { AdminMenu } from "@/components/admin-menu";
import { SignOutButton } from "@/components/sign-out-button";

// Slim sticky top bar (step 13.5). Server Component: reads the session for the auth
// control + Admin menu. Primary navigation (Ladder/Sessions/Submit) lives in the
// BottomNav tab bar now, not here — this bar carries identity + account only.
export async function SiteHeader() {
  const session = await auth();
  const role = session?.role as Role | undefined;

  return (
    <header className="bg-background/80 border-border sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image src="/icon.svg" alt="" width={28} height={28} className="rounded-md" />
          <span className="font-heading">BSC Squash</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {role === "ADMIN" && <AdminMenu />}
          {session?.user ? (
            <>
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {session.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/signin" className="text-sm font-medium">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
