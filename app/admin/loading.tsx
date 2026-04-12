export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center px-4">
          <div className="h-7 w-36 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border bg-background" />
        ))}
      </div>
    </main>
  );
}
