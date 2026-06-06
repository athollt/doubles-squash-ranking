import Link from "next/link";
import { cn } from "@/lib/utils";

// The single source of truth for page width, padding, title and PWA safe-area insets.
// Canonical replacement for the per-page `<main class="mx-auto max-w-… p-4 sm:p-8">
// + <h1>` pattern (three different max-widths across pages today). Every route renders
// inside one PageShell — set width once here, not per page. `bottomGutter` leaves room
// for the fixed BottomNav on mobile.
function PageShell({
  title,
  subtitle,
  back,
  className,
  children,
  bottomGutter = true,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  // Optional back link rendered above the title (e.g. detail → list).
  back?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
  bottomGutter?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-2xl px-4 pt-4",
        // pb leaves room for the bottom tab bar + the device safe-area inset.
        bottomGutter ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : "pb-8",
        className,
      )}
    >
      {back && (
        <Link
          href={back.href}
          className="text-primary mb-1 inline-block text-sm font-medium hover:underline"
        >
          ← {back.label}
        </Link>
      )}
      <h1 className="font-heading text-2xl font-black tracking-tight">{title}</h1>
      {subtitle != null && (
        <p className="text-muted-foreground mt-0.5 mb-4 text-sm">{subtitle}</p>
      )}
      {subtitle == null && <div className="mb-4" />}
      {children}
    </main>
  );
}

export { PageShell };
