"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinksFor, slugFromPathname, type Role } from "@/lib/nav";
import { cn } from "@/lib/utils";

// PWA bottom tab bar — the app's primary navigation model (per PROTOTYPE-NOTES-ux.md).
// `BottomNav` is the pure, testable core (role + slug + pathname in); `BottomNavBar`
// is the thin client wrapper that reads the live pathname. Tabs come from the shared
// nav model (navLinksFor) scoped to the current league, so the link set stays in
// sync — Submit only shows when signed in. Off a league route there is no bar.

// Keyed by the slug-independent NavLink.key.
const ICONS: Record<string, string> = {
  ladder: "🏆",
  sessions: "📋",
  submit: "🎾",
};

export function BottomNav({
  role,
  slug,
  pathname,
}: {
  role: Role | undefined;
  slug: string;
  pathname: string;
}) {
  const links = navLinksFor(role, slug);
  return (
    <nav
      aria-label="Primary"
      className="bg-card border-border fixed inset-x-0 bottom-0 z-50 flex border-t pb-[env(safe-area-inset-bottom)]"
    >
      {links.map((link) => {
        // Ladder (the slug root) matches exactly; the others by prefix.
        const active =
          link.key === "ladder"
            ? pathname === link.href
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.key}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span aria-hidden className="text-xl leading-none">
              {ICONS[link.key] ?? "•"}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNavBar({ role }: { role: Role | undefined }) {
  const pathname = usePathname();
  const slug = slugFromPathname(pathname);
  // The bottom bar is league navigation; hide it off a league route (e.g. the
  // landing redirect, /admin/users, /signin).
  if (!slug) return null;
  return <BottomNav role={role} slug={slug} pathname={pathname} />;
}
