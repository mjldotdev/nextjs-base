export default function Loading() {
  const skeletonKeys = [
    "skeleton-0",
    "skeleton-1",
    "skeleton-2",
    "skeleton-3",
    "skeleton-4",
    "skeleton-5",
  ];

  return (
    <div className="page-gradient min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Header skeleton */}
        <div className="mb-12">
          <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
          <div className="mt-3 h-5 w-96 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Status bar skeleton */}
        <div className="mb-8 flex items-center gap-6">
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          <div className="ml-auto flex gap-3">
            <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonKeys.map((key) => (
            <div
              className="animate-pulse rounded-lg border border-border bg-card p-5"
              key={key}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
