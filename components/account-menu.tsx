"use client";

import { Menu } from "@base-ui/react/menu";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";

// The signed-in user's account control in the header (mobile-app pattern): the
// profile avatar is a menu trigger that opens the email + Sign out. Shown for any
// signed-in user (admin or scorer), so it is the single place to sign out.
export function AccountMenu({
  name,
  email,
  image,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Account" className="flex items-center rounded-full">
        <Avatar name={name} email={email} image={image} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={10} align="end">
          <Menu.Popup className="bg-popover text-popover-foreground z-50 min-w-44 rounded-md border py-1.5 shadow-md outline-none">
            {email && (
              <p className="text-muted-foreground truncate px-3 pb-1.5 text-xs">
                {email}
              </p>
            )}
            <Menu.Item
              className="data-highlighted:bg-accent data-highlighted:text-accent-foreground block cursor-pointer px-3 py-1.5 text-sm outline-none"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
