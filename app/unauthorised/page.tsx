export const metadata = {
  title: "No access — Doubles Squash @ BSC",
};

export default function UnauthorisedPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">No access</h1>
      <p className="text-muted-foreground max-w-sm">
        Your Google account does not have access. Contact the admin.
      </p>
    </main>
  );
}
