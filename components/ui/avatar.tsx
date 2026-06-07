import { avatarInitial } from "@/lib/avatar";
import { cn } from "@/lib/utils";

// A small circular identity badge for the header. Shows the Google profile
// picture when present, otherwise the user's initial (lib/avatar). Plain <img>
// (not next/image) so arbitrary Google avatar URLs need no domain allowlist.
export function Avatar({
  name,
  email,
  image,
  className,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
  className?: string;
}) {
  const base = cn(
    "size-8 shrink-0 overflow-hidden rounded-full",
    className,
  );

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || email || "Account"}
        title={email ?? undefined}
        width={32}
        height={32}
        className={base}
      />
    );
  }

  return (
    <span
      title={email ?? undefined}
      className={cn(
        base,
        "bg-primary/10 text-primary font-heading flex items-center justify-center text-sm font-bold",
      )}
    >
      {avatarInitial({ name, email })}
    </span>
  );
}
