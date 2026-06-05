export type Role = "ADMIN" | "SCORER";

export interface NavLink {
  href: string;
  label: string;
}

// The nav links to show for a given role (undefined = logged out). Public
// links always show; Submit requires any session; Admin requires ADMIN.
export function navLinksFor(role: Role | undefined): NavLink[] {
  const links: NavLink[] = [
    { href: "/", label: "Ladder" },
    { href: "/sessions", label: "Sessions" },
  ];
  if (role) {
    links.push({ href: "/submit", label: "Submit" });
  }
  if (role === "ADMIN") {
    links.push({ href: "/admin/players", label: "Admin" });
  }
  return links;
}
