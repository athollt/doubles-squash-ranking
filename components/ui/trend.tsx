import type { Movement } from "@/lib/rating-engine";
import { cn } from "@/lib/utils";

// The ladder's "Trend" column: rank change since the previous snapshot, shown as
// ▲n / ▼n / NEW / —. Canonical replacement for the local MovementIndicator in
// app/page.tsx. Up is positive (green), down negative (red); see CONTEXT-redesign.md
// glossary ("Trend", not Move/Movement).
function Trend({ movement, className }: { movement: Movement; className?: string }) {
  const base = "font-bold tabular-nums";
  switch (movement.direction) {
    case "up":
      return <span className={cn(base, "text-[var(--up)]", className)}>▲{movement.places}</span>;
    case "down":
      return <span className={cn(base, "text-[var(--down)]", className)}>▼{movement.places}</span>;
    case "new":
      return <span className={cn(base, "text-muted-foreground", className)}>NEW</span>;
    default:
      return <span className={cn(base, "text-muted-foreground", className)}>—</span>;
  }
}

export { Trend };
