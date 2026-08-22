import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Page-level skeletons used by route `loading.tsx` files.
 *
 * These are pure server components (no client JS, no data fetching). Next.js
 * renders them instantly as the Suspense fallback while the real server
 * component streams in, so they improve perceived speed without adding any
 * runtime cost. They mirror the real page shells (rounded-[10px] cards, the
 * bg-muted/20 table header bar, StatCard spacing) so the swap is seamless.
 */

const STAT_GRID: Record<3 | 4, string> = {
  3: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
};

export function PageHeaderSkeleton({ actions = true }: { actions?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {actions ? (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-[10px]" />
          <Skeleton className="h-9 w-32 rounded-[10px]" />
        </div>
      ) : null}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-[10px] border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="size-9 rounded-[8px]" />
      </div>
      <Skeleton className="mt-4 h-7 w-28" />
      <Skeleton className="mt-2.5 h-3 w-36 max-w-full" />
    </div>
  );
}

export function StatCardsSkeleton({
  count = 4,
  cols = 4,
}: {
  count?: number;
  cols?: 3 | 4;
}) {
  return (
    <div className={STAT_GRID[cols]}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableCardSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b bg-muted/20 px-5 py-3.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="divide-y">
        <div className="flex items-center gap-4 px-5 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn("h-4 flex-1", c === 0 && "max-w-[110px]")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartCardSkeleton() {
  return (
    <div className="rounded-[10px] border bg-card p-5 shadow-xs">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-1.5 h-3 w-56 max-w-full" />
      <Skeleton className="mt-5 h-56 w-full rounded-[8px]" />
    </div>
  );
}

/**
 * Generic content fallback for list / detail / report pages: header, a row of
 * KPI cards, then a table. Used by the (dashboard) group `loading.tsx`.
 */
export function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <TableCardSkeleton rows={8} cols={5} />
    </div>
  );
}
