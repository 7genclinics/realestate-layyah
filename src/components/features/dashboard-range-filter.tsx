"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarRange, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const PRESETS = [
  { key: "today", labelKey: "rangeToday" },
  { key: "7d", labelKey: "range7d" },
  { key: "14d", labelKey: "range14d" },
  { key: "month", labelKey: "rangeMonth" },
] as const;

const pillBase =
  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60";
const pillActive = "bg-primary text-primary-foreground shadow-xs";
const pillIdle = "text-muted-foreground hover:bg-muted hover:text-foreground";

/**
 * Date-range filter for the dashboard's flow metrics. Presets navigate to
 * `?range=today|7d|14d`; "This Month" (the default) clears the param so the
 * base URL stays clean. "Custom" reveals two date inputs and pushes
 * `?range=custom&from=YYYY-MM-DD&to=YYYY-MM-DD`. Live-position tiles ignore this.
 */
export function DashboardRangeFilter({
  selected,
  from,
  to,
}: {
  selected: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showCustom, setShowCustom] = useState(selected === "custom");
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const t = useTranslations("dashboard");

  function go(href: string) {
    startTransition(() => router.push(href));
  }

  function selectPreset(key: string) {
    setShowCustom(false);
    // "month" is the default view — keep the URL clean for it.
    go(key === "month" ? pathname : `${pathname}?range=${key}`);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    const [lo, hi] =
      customFrom <= customTo ? [customFrom, customTo] : [customTo, customFrom];
    go(`${pathname}?range=custom&from=${lo}&to=${hi}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-xs">
        {isPending ? (
          <Loader2 className="ml-1 size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <CalendarRange className="ml-1 size-4 shrink-0 text-muted-foreground" />
        )}
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => selectPreset(preset.key)}
            disabled={isPending}
            className={cn(
              pillBase,
              selected === preset.key && !showCustom ? pillActive : pillIdle,
            )}
          >
            {t(preset.labelKey)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((value) => !value)}
          disabled={isPending}
          className={cn(
            pillBase,
            selected === "custom" || showCustom ? pillActive : pillIdle,
          )}
        >
          {t("rangeCustom")}
        </button>
      </div>

      {showCustom ? (
        <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1 shadow-xs">
          <input
            type="date"
            value={customFrom}
            max={customTo || undefined}
            onChange={(event) => setCustomFrom(event.target.value)}
            className="h-6 bg-transparent text-xs text-foreground focus:outline-none"
            aria-label={t("fromDate")}
          />
          <span className="text-xs text-muted-foreground">→</span>
          <input
            type="date"
            value={customTo}
            min={customFrom || undefined}
            onChange={(event) => setCustomTo(event.target.value)}
            className="h-6 bg-transparent text-xs text-foreground focus:outline-none"
            aria-label={t("toDate")}
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={isPending || !customFrom || !customTo}
            className={cn(pillBase, pillActive, "disabled:opacity-40")}
          >
            {t("apply")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
