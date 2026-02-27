export function PendingItemSkeleton() {
  return (
    <div className="glass-card border-0 p-3 animate-pulse">
      <div className="flex gap-4">
        <div className="h-20 w-20 rounded-md bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-5 w-20 rounded bg-muted mt-4" />
        </div>
      </div>
    </div>
  );
}
