export default function PhotocardLoading() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Breadcrumb skeleton */}
        <nav className="mb-6 flex gap-2 text-sm">
          <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </nav>

        {/* Hero Section */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Image skeleton */}
          <div className="flex flex-col gap-4">
            <div className="aspect-[5/7] w-full overflow-hidden rounded-xl bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 animate-shimmer" />
            <div className="h-10 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>

          {/* Details skeleton */}
          <div className="space-y-6">
            {/* Title area */}
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="h-10 w-48 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="h-6 w-40 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mt-2" />
            </div>

            {/* Price section */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
              <div className="h-4 w-12 rounded bg-neutral-300 dark:bg-neutral-700 animate-pulse" />
              <div className="h-10 w-32 rounded bg-neutral-300 dark:bg-neutral-700 animate-pulse" />
              <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 space-y-2">
                <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-6 w-12 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
              <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 space-y-2">
                <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-6 w-12 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
            </div>

            {/* Action button skeleton */}
            <div className="h-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>
        </div>

        {/* Price history section skeleton */}
        <div className="mt-12">
          <div className="mb-4 h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="h-64 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        </div>

        {/* Buy links section skeleton */}
        <div className="mt-12">
          <div className="mb-4 h-8 w-56 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Info section skeleton */}
        <div className="mt-12 rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
          <div className="h-6 w-16 rounded bg-neutral-300 dark:bg-neutral-700 animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
