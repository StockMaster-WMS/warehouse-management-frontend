import { Skeleton } from "@/components/ui/skeleton";

/**
 * Standard loading skeleton for detail pages.
 * Shows: header placeholder → grid (2 content cards + sidebar card).
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-48 rounded-lg" />

      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-72 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
