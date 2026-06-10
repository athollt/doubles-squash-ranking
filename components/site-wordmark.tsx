"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { slugFromPathname } from "@/lib/nav";

// The header brand link. Reads the live pathname (so it updates on every client
// navigation) and shows the current League's name when on a /l/{slug} route,
// else the "Rungs" brand. The slug→name map is supplied by the server header.
export function SiteWordmark({
  leagueNames,
}: {
  leagueNames: Record<string, string>;
}) {
  const pathname = usePathname();
  const slug = slugFromPathname(pathname);
  const wordmark = (slug && leagueNames[slug]) || "Rungs";

  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 font-bold">
      <Image src="/icon.svg" alt="" width={28} height={28} className="shrink-0 rounded-md" />
      <span className="font-heading truncate">{wordmark}</span>
    </Link>
  );
}
