import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { navLinksFor, type Role } from "@/lib/nav";
import { SignOutButton } from "@/components/sign-out-button";

// Global app shell header. Server Component: reads the session to decide which
// nav links and auth control to show. Structure only — styling lands at step 13.
export async function SiteHeader() {
  const session = await auth();
  const role = session?.role as Role | undefined;
  const links = navLinksFor(role);

  return (
    <header className="border-b">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-4 p-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/icon.svg"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
          />
          Doubles Squash @ BSC
        </Link>
        <div className="flex items-center gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="text-muted-foreground text-sm">
                {session.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/signin" className="text-sm">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
