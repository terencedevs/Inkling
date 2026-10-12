import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Neutral loading placeholders (platform-owned). Built on the Skeleton primitive, which paints
 * with a translucent foreground tint, so they read as "content is coming" in any palette and
 * in both themes without introducing a color of their own.
 *
 *   <PageSkeleton />                 route fallback while a page chunk loads (the router uses it)
 *   <ListSkeleton rows={8} />        a list or table before its first fetch resolves
 *   <DetailSkeleton />               a single record before it resolves
 *   <StatsSkeleton count={4} />      a row of metric tiles
 *   <Skeleton className="h-4 w-40" />  anything else — compose your own to match the page's shape
 */
export function StatsSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-border p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6, className }) {
  return (
    <div className={cn('rounded-lg border border-border', className)} aria-hidden="true">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ml-auto h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton({ className }) {
  return (
    <div className={cn('space-y-6', className)} aria-hidden="true">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 rounded-lg border border-border p-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-lg border border-border p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

export default function PageSkeleton({ className }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={cn('space-y-6', className)}>
      <span className="sr-only">Loading</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <StatsSkeleton />
      <ListSkeleton rows={5} />
    </div>
  );
}
