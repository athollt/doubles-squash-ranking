export type Role = "ADMIN" | "SCORER";

export interface NavLink {
  href: string;
  label: string;
}

// The admin pages, shown to an ADMIN in the header's "Admin" dropdown (not the
// primary nav row). Order = the dropdown order.
export const adminLinks: NavLink[] = [
  { href: "/admin/players", label: "Players" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
];

// The primary nav links to show for a given role (undefined = logged out).
// Public links always show; Submit requires any session. Admin pages are
// surfaced separately via `adminLinks` (the dropdown), gated on ADMIN.
export function navLinksFor(role: Role | undefined): NavLink[] {
  const links: NavLink[] = [
    { href: "/", label: "Ladder" },
    { href: "/sessions", label: "Sessions" },
  ];
  if (role) {
    links.push({ href: "/submit", label: "Submit" });
  }
  return links;
}
