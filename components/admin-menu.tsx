"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDownIcon } from "lucide-react";
import { adminLinks } from "@/lib/nav";

// "Admin" dropdown in the global header (ADMIN only). Lists every admin page —
// the only navigation to /admin/sessions, /admin/settings and /admin/users.
export function AdminMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
        Admin
        <ChevronDownIcon className="size-3.5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="start">
          <Menu.Popup className="bg-popover text-popover-foreground z-50 min-w-36 rounded-md border p-1 shadow-md outline-none">
            {adminLinks.map((link) => (
              <Menu.Item
                key={link.href}
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
