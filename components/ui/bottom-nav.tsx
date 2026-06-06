"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinksFor, type Role } from "@/lib/nav";
import { cn } from "@/lib/utils";

// PWA bottom tab bar — the app's primary navigation model (per PROTOTYPE-NOTES-ux.md).
// `BottomNav` is the pure, testable core (role + pathname in); `BottomNavBar` is the
// thin client wrapper that reads the live pathname. Wired into the layout in 13.5.
// Tabs come from the shared nav model (navLinksFor), so the link set stays in sync
// with the top-header logic — Submit only shows when signed in.

const ICONS: Record<string, string> = {
  "/": "🏆",
  "/sessions": "📋",
  "/submit": "🎾",
};

export function BottomNav({
  role,
  pathname,
}: {
  role: Role | undefined;
  pathname: string;
}) {
  const links = navLinksFor(role);
  return (
    <nav
      aria-label="Primary"
      className="bg-card border-border fixed inset-x-0 bottom-0 z-50 flex border-t pb-[env(safe-area-inset-bottom)]"
    >
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span aria-hidden className="text-xl leading-none">
              {ICONS[link.href] ?? "•"}
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
  return <BottomNav role={role} pathname={pathname} />;
}
