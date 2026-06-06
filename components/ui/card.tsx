import { cn } from "@/lib/utils";

// Card-first surface the mobile design leans on — canonical replacement for the
// inline bordered rows in app/page.tsx (LadderCards). Pass `title` for a labelled
// section; omit it for a plain content surface.
function Card({
  className,
  title,
  children,
  ...props
}: React.ComponentProps<"div"> & { title?: React.ReactNode }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground border-border rounded-xl border p-4",
        className,
      )}
      {...props}
    >
      {title != null && (
        <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export { Card };
