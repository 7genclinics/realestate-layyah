import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  params?: Record<string, string | undefined>;
}

function buildHref(page: number, params: Record<string, string | undefined>): string {
  const entries = Object.entries({ ...params, page: String(page) }).filter(
    ([, v]) => v !== undefined && v !== "",
  ) as [string, string][];
  const qs = new URLSearchParams(entries).toString();
  return `?${qs}`;
}

export function TablePagination({
  page,
  total,
  pageSize = 20,
  params = {},
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        {start}–{end} of {total} records
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={!hasPrev}
          render={hasPrev ? <Link href={buildHref(page - 1, params)} /> : undefined}
        >
          <ChevronLeft className="size-3.5" />
          Prev
        </Button>
        <span className="px-2 text-xs">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={!hasNext}
          render={hasNext ? <Link href={buildHref(page + 1, params)} /> : undefined}
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
