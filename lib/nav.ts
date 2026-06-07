export type Role = "ADMIN" | "SCORER";

export interface NavLink {
  href: string;
  label: string;
}

// The admin pages, shown in the header's hamburger menu (not the primary nav
// row). Order = the menu order.
export const adminLinks: NavLink[] = [
  { href: "/admin/players", label: "Players" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
];

// The menu links for a given role. Scorers may reach Players, Sessions and
// Settings (Settings read-only — editing stays admin-only via the Edit button +
// server check). Users (account/role management) is ADMIN-only. Mirrors
// `authorizeRoute`'s route gate.
export function adminLinksFor(role: Role): NavLink[] {
  if (role === "ADMIN") return adminLinks;
  return adminLinks.filter((l) => l.href !== "/admin/users");
}

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
