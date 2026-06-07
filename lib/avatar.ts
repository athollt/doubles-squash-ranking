// The single character shown in the header avatar circle when a signed-in user
// has no Google profile picture (e.g. the Credentials test users). Prefers the
// name, falls back to the email, then to "?".
export function avatarInitial({
  name,
  email,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
}): string {
  const source = (name?.trim() || email?.trim() || "").charAt(0);
  return source ? source.toUpperCase() : "?";
}
