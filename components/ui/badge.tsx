import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Small status pill. Canonical primitive for the ladder's "New" (provisional) flag
// and inactive/status markers — replaces the per-page inline spans (StatusBadge in
// app/page.tsx). Use the `new` variant for provisional players, `muted` for
// inactive/resting, `accent` for emphasis.
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        new: "bg-accent/30 text-primary",
        muted: "bg-muted text-muted-foreground",
        accent: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "new",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
