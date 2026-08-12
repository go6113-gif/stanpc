export function SkeletonCard() {
  return (
    <div className="group relative block overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
      {/* Aspect ratio container matching CardThumbnail */}
      <div className="aspect-[5/7] w-full overflow-hidden bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 animate-shimmer">
        {/* Shimmer effect using CSS animation */}
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      </div>

      {/* Overlay area with shimmer skeletons */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2 pt-8 opacity-0 sm:opacity-100">
        {/* Group badge skeleton */}
        <div className="h-5 w-16 rounded-full bg-white/15 animate-pulse" />

        {/* Title skeleton */}
        <div className="mt-2 space-y-2">
          <div className="h-3 w-24 rounded bg-white/20 animate-pulse" />
          <div className="h-3 w-20 rounded bg-white/15 animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="mt-3 grid grid-cols-2 gap-1 text-[9px]">
          <div className="flex flex-col gap-0.5">
            <div className="h-2 w-12 rounded bg-white/20 animate-pulse" />
            <div className="h-3 w-14 rounded bg-white/20 animate-pulse mt-1" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="h-2 w-12 rounded bg-white/20 animate-pulse" />
            <div className="h-3 w-14 rounded bg-white/20 animate-pulse mt-1" />
          </div>
          <div className="col-span-2 mt-1">
            <div className="h-3 w-20 rounded bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonPhotoCardGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
