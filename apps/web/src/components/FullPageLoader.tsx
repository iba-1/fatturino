export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar-bg">
      <div className="flex flex-col items-center gap-4">
        <span className="text-2xl font-bold tracking-tight text-sidebar-foreground">
          Fatturino
        </span>
        <div
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    </div>
  );
}
