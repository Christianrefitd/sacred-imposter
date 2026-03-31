export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-muted-foreground">
        Check your connection and try again.
      </p>
    </div>
  );
}
