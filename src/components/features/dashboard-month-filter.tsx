"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarRange, Loader2 } from "lucide-react";

type MonthOption = { value: string; label: string };

/**
 * Month selector for the dashboard's flow metrics. Navigates to
 * `?month=YYYY-MM`; selecting the current month (the first option) clears the
 * param so the default URL stays clean. Live-position tiles ignore this.
 */
export function DashboardMonthFilter({
  options,
  selected,
}: {
  options: MonthOption[];
  selected: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentMonth = options[0]?.value;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    const href = value && value !== currentMonth ? `${pathname}?month=${value}` : pathname;
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1 shadow-xs">
      {isPending ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
      )}
      <label htmlFor="dashboard-month" className="sr-only">
        Filter dashboard by month
      </label>
      <select
        id="dashboard-month"
        value={selected}
        onChange={handleChange}
        disabled={isPending}
        className="h-6 bg-transparent pr-1 text-sm font-medium text-foreground focus:outline-none disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
