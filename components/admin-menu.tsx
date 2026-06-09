"use client";

import { Menu } from "@base-ui/react/menu";
import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  adminLinksFor,
  globalAdminLinks,
  slugFromPathname,
  type Role,
} from "@/lib/nav";

// Management menu in the global header (any signed-in user). A hamburger that
// opens the per-league management pages for the current league, plus the global
// admin links (Leagues, Users) for an admin. Off a league route only the global
// admin links apply, so a non-admin sees nothing and the menu is hidden.
export function AdminMenu({ role }: { role: Role }) {
  const pathname = usePathname();
  const slug = slugFromPathname(pathname);
  // Per-league links need a slug. Off a league route, an admin still gets the
  // global links (Leagues, Users); a scorer has nothing to show.
  const links = slug
    ? adminLinksFor(role, slug)
    : role === "ADMIN"
      ? globalAdminLinks()
      : [];
  if (links.length === 0) return null;
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Menu"
        className="text-muted-foreground hover:text-foreground flex items-center"
      >
        <MenuIcon className="size-5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={10} align="start">
          <Menu.Popup className="bg-popover text-popover-foreground z-50 min-w-36 rounded-md border p-1.5 shadow-md outline-none">
            {links.map((link) => (
              <Menu.Item
                key={link.key}
                className="data-highlighted:bg-accent data-highlighted:text-accent-foreground block cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none"
                render={<a href={link.href} />}
              >
                {link.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
