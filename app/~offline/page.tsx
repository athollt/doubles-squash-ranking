export const metadata = {
  title: "Offline — BSC Squash",
};

// Served by the service worker when a document navigation fails with no network.
export default function Offline() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-semibold">You&rsquo;re offline</h1>
      <p className="text-muted-foreground text-sm">
        The ladder needs a connection to load. Reconnect and try again.
      </p>
    </main>
  );
}
