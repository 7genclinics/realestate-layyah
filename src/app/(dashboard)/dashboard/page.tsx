import Link from "next/link";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  CalendarClock,
  Coins,
  Handshake,
  HardHat,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/server";
import { deriveInstallmentStatus } from "@/lib/permissions";
import {
  summarizeDay,
  summarizeRange,
  sumBalancesByAccountType,
} from "@/lib/cash-book";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import type { PropertyStatus } from "@/lib/database.types";
import { formatPkr } from "@/lib/format";
import { getGracePeriodDays } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { StatCard, type StatCardProps } from "@/components/ui/stat-card";
import {
  DashboardCharts,
  type CashflowPoint,
  type InventorySlice,
} from "@/components/features/dashboard-charts";
import { DashboardRangeFilter } from "@/components/features/dashboard-range-filter";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

const SNAPSHOT_STATUSES: PropertyStatus[] = [
  "available",
  "hold",
  "booked",
  "sold",
  "rented",
  "transferred",
];

const INVENTORY_COLORS: Record<PropertyStatus, string> = {
  available: "#7eb89a",
  hold: "#e2c56b",
  booked: "#7eb6d9",
  sold: "#8fa4e0",
  rented: "#9ad0d4",
  transferred: "#d4a5b8",
  blocked: "#d98989",
};

const INVENTORY_TILE: Record<PropertyStatus, string> = {
  available: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-card hover:border-emerald-500/40",
  hold: "border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-card hover:border-amber-500/40",
  booked: "border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-card hover:border-sky-500/40",
  sold: "border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-card hover:border-indigo-500/40",
  rented: "border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-card hover:border-cyan-500/40",
  transferred: "border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-card hover:border-rose-500/40",
  blocked: "border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-card hover:border-rose-500/40",
};

/**
 * Period-over-period delta badge for a flow metric, comparing the selected
 * range to the equal-length window immediately before it. `suffix` labels the
 * comparison (e.g. "MoM", "vs prev 7d"). `lowerIsBetter` flips the colour (used
 * for expenses, where an increase is bad). Returns undefined when there is
 * nothing meaningful to compare.
 */
function flowTrend(
  current: number,
  previous: number,
  suffix: string,
  opts?: { lowerIsBetter?: boolean },
): StatCardProps["trend"] {
  if (previous <= 0) {
    if (current <= 0) return undefined;
    return { value: "▲ new", isPositive: !opts?.lowerIsBetter };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { value: "— flat", isPositive: true };
  const up = pct > 0;
  return {
    value: `${up ? "▲" : "▼"} ${Math.abs(pct)}% ${suffix}`,
    isPositive: opts?.lowerIsBetter ? !up : up,
  };
}

/** ISO `yyyy-MM-dd` → Date at local midnight, or null if malformed. */
function parseISODate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  // Resolve the flow-metric window from `?range=`. Presets are relative to now;
  // "custom" reads explicit from/to. Bad input falls back to the current month.
  const params = await searchParams;
  let rangeStart: Date;
  let rangeEnd: Date;
  let resolvedKey: "today" | "7d" | "14d" | "month" | "custom";
  let customFrom: string | undefined;
  let customTo: string | undefined;

  switch (params.range) {
    case "today":
      rangeStart = startOfDay(now);
      rangeEnd = endOfDay(now);
      resolvedKey = "today";
      break;
    case "7d":
      rangeStart = startOfDay(subDays(now, 6));
      rangeEnd = endOfDay(now);
      resolvedKey = "7d";
      break;
    case "14d":
      rangeStart = startOfDay(subDays(now, 13));
      rangeEnd = endOfDay(now);
      resolvedKey = "14d";
      break;
    case "custom": {
      const parsedFrom = parseISODate(params.from);
      const parsedTo = parseISODate(params.to);
      if (parsedFrom && parsedTo) {
        const [lo, hi] =
          parsedFrom <= parsedTo ? [parsedFrom, parsedTo] : [parsedTo, parsedFrom];
        rangeStart = startOfDay(lo);
        rangeEnd = endOfDay(hi);
        resolvedKey = "custom";
        customFrom = format(rangeStart, "yyyy-MM-dd");
        customTo = format(rangeEnd, "yyyy-MM-dd");
        break;
      }
      rangeStart = startOfMonth(now);
      rangeEnd = endOfMonth(now);
      resolvedKey = "month";
      break;
    }
    default:
      rangeStart = startOfMonth(now);
      rangeEnd = endOfMonth(now);
      resolvedKey = "month";
      break;
  }

  // Comparison window: the equal-length period immediately before the range.
  const durationDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
  const prevEnd = endOfDay(subDays(rangeStart, 1));
  const prevStart = startOfDay(subDays(prevEnd, durationDays - 1));

  const fromStr = format(rangeStart, "yyyy-MM-dd");
  const toStr = format(rangeEnd, "yyyy-MM-dd");
  const prevFromStr = format(prevStart, "yyyy-MM-dd");
  const prevToStr = format(prevEnd, "yyyy-MM-dd");

  const isMonthToDate = resolvedKey === "month";
  const rangeIncludesToday = today >= fromStr && today <= toStr;
  // The daily chart never runs past today (future days carry no data).
  const chartEnd = isAfter(rangeEnd, now) ? now : rangeEnd;

  const rangeLabel =
    resolvedKey === "today"
      ? "Today"
      : resolvedKey === "7d"
        ? "Last 7 days"
        : resolvedKey === "14d"
          ? "Last 14 days"
          : resolvedKey === "month"
            ? format(now, "MMMM yyyy")
            : `${format(rangeStart, "d MMM")} – ${format(rangeEnd, "d MMM yyyy")}`;

  const trendSuffix =
    resolvedKey === "today"
      ? "vs yesterday"
      : resolvedKey === "month"
        ? "MoM"
        : resolvedKey === "7d"
          ? "vs prev 7d"
          : resolvedKey === "14d"
            ? "vs prev 14d"
            : "vs prev period";

  const [
    { count: societyCount },
    { data: properties },
    { data: receiptRows },
    { data: installmentRows },
    { data: cashAccounts },
    { data: cashTransactions },
    { data: salesRows },
    { data: contractRows },
    { data: commissionRows },
    { data: payrollRows },
    gracePeriodDays,
  ] = await Promise.all([
    supabase.from("societies").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("status"),
    // Selected range + its comparison window, so both totals and the trend
    // come from one query.
    supabase
      .from("receipts")
      .select("amount, payment_date")
      .gte("payment_date", prevFromStr)
      .lte("payment_date", toStr),
    supabase
      .from("installments")
      .select("due_date, scheduled_amount, received_amount"),
    supabase
      .from("cash_accounts")
      .select("id, account_type, opening_balance")
      .eq("is_active", true),
    supabase
      .from("cash_transactions")
      .select(
        "cash_account_id, transaction_date, transaction_type, transfer_side, amount, status",
      )
      .eq("status", "posted"),
    supabase
      .from("sales")
      .select("sale_amount, remaining_amount, status, created_at")
      .is("deleted_at", null),
    supabase.from("contracts").select("remaining_amount, status"),
    supabase.from("agent_commissions").select("commission_amount, status"),
    supabase.from("payroll_records").select("net_salary, payment_status"),
    getGracePeriodDays(),
  ]);

  const mappedCash = (cashTransactions ?? []).map((row) => ({
    cash_account_id: row.cash_account_id,
    transaction_date: row.transaction_date,
    transaction_type: row.transaction_type,
    transfer_side: row.transfer_side,
    amount: Number(row.amount),
    status: row.status,
  }));

  // Live balances use every posted transaction — never month-scoped.
  const { cashTotal, bankTotal } = sumBalancesByAccountType(
    cashAccounts ?? [],
    mappedCash,
  );

  // --- Flow metrics for the selected range (vs the comparison window) ---
  const inRange = (date: string | null | undefined, lo: string, hi: string) =>
    !!date && date >= lo && date <= hi;

  const rangeReceipts = (receiptRows ?? []).filter((row) =>
    inRange(row.payment_date, fromStr, toStr),
  );
  const rangeCollections = rangeReceipts.reduce((sum, row) => sum + Number(row.amount), 0);
  const prevCollections = (receiptRows ?? [])
    .filter((row) => inRange(row.payment_date, prevFromStr, prevToStr))
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const todayCollections = rangeReceipts
    .filter((row) => row.payment_date === today)
    .reduce((sum, row) => sum + Number(row.amount), 0);

  const rangeExpenses = summarizeRange(fromStr, toStr, mappedCash).expense;
  const prevExpenses = summarizeRange(prevFromStr, prevToStr, mappedCash).expense;

  const rangeSales = (salesRows ?? []).filter(
    (row) =>
      row.status !== "cancelled" &&
      inRange(row.created_at?.slice(0, 10), fromStr, toStr),
  );
  const rangeSaleValue = rangeSales.reduce((sum, row) => sum + Number(row.sale_amount), 0);
  const prevSales = (salesRows ?? []).filter(
    (row) =>
      row.status !== "cancelled" &&
      inRange(row.created_at?.slice(0, 10), prevFromStr, prevToStr),
  );
  const prevSaleValue = prevSales.reduce((sum, row) => sum + Number(row.sale_amount), 0);

  const rangeNet = rangeCollections - rangeExpenses;
  const prevNet = prevCollections - prevExpenses;

  let overdueCount = 0;
  let overdueAmount = 0;
  let dueSoonCount = 0;
  const dueSoonLimit = new Date();
  dueSoonLimit.setDate(dueSoonLimit.getDate() + 7);

  for (const row of installmentRows ?? []) {
    const scheduled = Number(row.scheduled_amount);
    const received = Number(row.received_amount);
    const status = deriveInstallmentStatus(row.due_date, scheduled, received, {
      gracePeriodDays,
    });

    if (status === "overdue") {
      overdueCount += 1;
      overdueAmount += Math.max(scheduled - received, 0);
    }

    const due = new Date(`${row.due_date}T00:00:00`);
    if (
      (status === "due" || status === "upcoming") &&
      due <= dueSoonLimit &&
      received < scheduled
    ) {
      dueSoonCount += 1;
    }
  }

  const statusCounts = Object.fromEntries(
    SNAPSHOT_STATUSES.map((status) => [status, 0]),
  ) as Record<PropertyStatus, number>;

  for (const property of properties ?? []) {
    statusCounts[property.status] = (statusCounts[property.status] ?? 0) + 1;
  }

  const cashflow: CashflowPoint[] = eachDayOfInterval({
    start: rangeStart,
    end: chartEnd,
  }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    const collections = (receiptRows ?? [])
      .filter((row) => row.payment_date === date)
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const daySummary = summarizeDay(date, mappedCash);

    return {
      date,
      label: format(day, "dd MMM"),
      collections,
      expenses: daySummary.expense,
    };
  });

  const inventory: InventorySlice[] = SNAPSHOT_STATUSES.map((status) => ({
    key: status,
    label: PROPERTY_STATUS_LABELS[status],
    value: statusCounts[status],
    fill: INVENTORY_COLORS[status],
  }));

  const receivable = (salesRows ?? [])
    .filter((row) => row.status !== "cancelled" && row.status !== "closed")
    .reduce((sum, row) => sum + Number(row.remaining_amount), 0);

  const unitCount = properties?.length ?? 0;

  // Contractor / party payables — outstanding balance on active work orders.
  const partyPayable = (contractRows ?? [])
    .filter((row) => row.status === "active")
    .reduce((sum, row) => sum + Number(row.remaining_amount ?? 0), 0);

  // Agent commissions owed but not yet disbursed (earned or approved, unpaid).
  const commissionPayable = (commissionRows ?? [])
    .filter((row) => row.status === "pending" || row.status === "approved")
    .reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0);

  // Salaries generated on payroll but still awaiting disbursement.
  const salariesDue = (payrollRows ?? [])
    .filter((row) => row.payment_status === "pending")
    .reduce((sum, row) => sum + Number(row.net_salary ?? 0), 0);

  // Flow metrics for the selected range (filterable; carry a period trend badge).
  const flowTiles: StatCardProps[] = [
    {
      title: "Collections",
      value: formatPkr(rangeCollections),
      hint: rangeIncludesToday
        ? `${rangeReceipts.length} receipts · ${formatPkr(todayCollections)} today`
        : `${rangeReceipts.length} receipts`,
      href: "/receipts",
      icon: TrendingUp,
      variant: "success",
      trend: flowTrend(rangeCollections, prevCollections, trendSuffix),
    },
    {
      title: "Expenses",
      value: formatPkr(rangeExpenses),
      hint: "Posted cash-book expenses",
      href: "/cash-book",
      icon: TrendingDown,
      variant: "danger",
      trend: flowTrend(rangeExpenses, prevExpenses, trendSuffix, { lowerIsBetter: true }),
    },
    {
      title: "New Sales",
      value: formatPkr(rangeSaleValue),
      hint: `${rangeSales.length} sale${rangeSales.length === 1 ? "" : "s"} booked`,
      href: "/reports/sales",
      icon: Handshake,
      variant: "primary",
      trend: flowTrend(rangeSaleValue, prevSaleValue, trendSuffix),
    },
    {
      title: "Net Cash Flow",
      value: formatPkr(rangeNet),
      hint: "Collections − expenses",
      href: "/reports/cash-book",
      icon: ArrowLeftRight,
      variant: rangeNet >= 0 ? "success" : "danger",
      trend: flowTrend(rangeNet, prevNet, trendSuffix),
    },
  ];

  // Live position — point-in-time snapshots that ignore the month filter.
  const liveTiles: StatCardProps[] = [
    {
      title: "Cash in Hand",
      value: formatPkr(cashTotal),
      hint: "Posted cash accounts",
      href: "/cash-book",
      icon: Wallet,
      variant: "sky",
    },
    {
      title: "Bank Balance",
      value: formatPkr(bankTotal),
      hint: "Configured bank accounts",
      href: "/cash-book",
      icon: Banknote,
      variant: "primary",
    },
    {
      title: "Overdue Installments",
      value: String(overdueCount),
      hint: `${formatPkr(overdueAmount)} outstanding`,
      href: "/reports/installments?window=overdue",
      icon: AlertTriangle,
      variant: "warning",
    },
    {
      title: "Due in 7 Days",
      value: String(dueSoonCount),
      hint: "Upcoming installment milestones",
      href: "/installments",
      icon: CalendarClock,
      variant: "indigo",
    },
  ];

  const financials: StatCardProps[] = [
    {
      title: "Party Payable",
      value: formatPkr(partyPayable),
      hint: "Outstanding on active contracts",
      href: "/reports/parties",
      icon: HardHat,
      variant: "warning",
    },
    {
      title: "Commission Payable",
      value: formatPkr(commissionPayable),
      hint: "Agent commissions unpaid",
      href: "/agents",
      icon: Handshake,
      variant: "indigo",
    },
    {
      title: "Salaries Due",
      value: formatPkr(salariesDue),
      hint: "Payroll awaiting disbursement",
      href: "/staff",
      icon: Coins,
      variant: "danger",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`${format(now, "EEEE, d MMMM yyyy")} · ${societyCount ?? 0} societ${(societyCount ?? 0) === 1 ? "y" : "ies"} · ${unitCount} units · Receivable ${formatPkr(receivable)}`}
        actions={
          <>
            <Button variant="outline" size="sm" render={<Link href="/customers/new" />}>
              <Users />
              Add customer
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/inventory/new" />}>
              <Plus />
              Add property
            </Button>
            <Button size="sm" render={<Link href="/receipts/new" />}>
              <Receipt />
              Receive payment
            </Button>
          </>
        }
      />

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {rangeLabel} performance
            {isMonthToDate ? (
              <span className="ml-2 font-normal normal-case text-muted-foreground/70">
                month to date
              </span>
            ) : null}
          </h2>
          <DashboardRangeFilter
            selected={resolvedKey}
            from={customFrom}
            to={customTo}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {flowTiles.map((tile) => (
            <StatCard key={tile.title} {...tile} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live position
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {liveTiles.map((tile) => (
            <StatCard key={tile.title} {...tile} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Payables
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {financials.map((tile) => (
            <StatCard key={tile.title} {...tile} />
          ))}
        </div>
      </div>

      <DashboardCharts
        cashflow={cashflow}
        inventory={inventory}
        cashflowLabel={isMonthToDate ? `${rangeLabel} · to date` : rangeLabel}
      />

      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-sky-50/40">
        <div className="flex items-center justify-between gap-3 border-b border-sky-100/80 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Inventory snapshot</h2>
            <p className="text-sm text-muted-foreground">
              Units by current status
            </p>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/inventory" />}>
            View inventory
          </Button>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
          {SNAPSHOT_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/inventory?status=${status}`}
              className={cn(
                "rounded-xl border p-3 transition-colors hover:brightness-[0.98]",
                INVENTORY_TILE[status],
              )}
            >
              <p className="text-xs text-muted-foreground">
                {PROPERTY_STATUS_LABELS[status]}
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {statusCounts[status]}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
