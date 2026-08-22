import Link from "next/link";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
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
import { DashboardMonthFilter } from "@/components/features/dashboard-month-filter";
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
 * Month-over-month delta badge for a flow metric. `lowerIsBetter` flips the
 * colour (used for expenses, where an increase is bad). Returns undefined when
 * there is nothing meaningful to compare.
 */
function monthTrend(
  current: number,
  previous: number,
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
    value: `${up ? "▲" : "▼"} ${Math.abs(pct)}% MoM`,
    isPositive: opts?.lowerIsBetter ? !up : up,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  // Month picker: last 12 months, newest first. The selected value is bounded to
  // these options, so a hand-typed / stale `?month=` falls back to this month.
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(startOfMonth(now), index);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy") };
  });
  const currentKey = monthOptions[0].value;
  const requested = (await searchParams).month;
  const selectedKey = monthOptions.some((option) => option.value === requested)
    ? (requested as string)
    : currentKey;
  const isCurrentMonth = selectedKey === currentKey;

  const selectedStart = startOfMonth(new Date(`${selectedKey}-01T00:00:00`));
  const selectedEnd = endOfMonth(selectedStart);
  const prevStart = startOfMonth(subMonths(selectedStart, 1));
  const prevKey = format(prevStart, "yyyy-MM");
  const selectedLabel = format(selectedStart, "MMMM yyyy");

  const monthStart = format(selectedStart, "yyyy-MM-dd");
  const monthEnd = format(selectedEnd, "yyyy-MM-dd");
  const prevMonthStart = format(prevStart, "yyyy-MM-dd");
  const prevMonthEnd = format(endOfMonth(prevStart), "yyyy-MM-dd");
  // The daily chart runs to today for the live month, else the full month.
  const chartEnd = isCurrentMonth ? now : selectedEnd;

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
    // Selected + previous month, so month totals and the MoM trend come from one query.
    supabase
      .from("receipts")
      .select("amount, payment_date")
      .gte("payment_date", prevMonthStart)
      .lte("payment_date", monthEnd),
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

  // --- Month-scoped flow metrics (selected vs previous month) ---
  const receiptsIn = (key: string) =>
    (receiptRows ?? []).filter((row) => row.payment_date?.slice(0, 7) === key);
  const monthReceipts = receiptsIn(selectedKey);
  const monthCollections = monthReceipts.reduce((sum, row) => sum + Number(row.amount), 0);
  const prevCollections = receiptsIn(prevKey).reduce((sum, row) => sum + Number(row.amount), 0);
  const todayCollections = monthReceipts
    .filter((row) => row.payment_date === today)
    .reduce((sum, row) => sum + Number(row.amount), 0);

  const monthExpenses = summarizeRange(monthStart, monthEnd, mappedCash).expense;
  const prevExpenses = summarizeRange(prevMonthStart, prevMonthEnd, mappedCash).expense;

  const monthSales = (salesRows ?? []).filter(
    (row) => row.created_at?.slice(0, 7) === selectedKey && row.status !== "cancelled",
  );
  const monthSaleValue = monthSales.reduce((sum, row) => sum + Number(row.sale_amount), 0);
  const prevSales = (salesRows ?? []).filter(
    (row) => row.created_at?.slice(0, 7) === prevKey && row.status !== "cancelled",
  );
  const prevSaleValue = prevSales.reduce((sum, row) => sum + Number(row.sale_amount), 0);

  const monthNet = monthCollections - monthExpenses;
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
    start: selectedStart,
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

  // Flow metrics for the selected month (filterable; carry a MoM trend badge).
  const monthlyTiles: StatCardProps[] = [
    {
      title: "Collections",
      value: formatPkr(monthCollections),
      hint: isCurrentMonth
        ? `${monthReceipts.length} receipts · ${formatPkr(todayCollections)} today`
        : `${monthReceipts.length} receipts`,
      href: "/receipts",
      icon: TrendingUp,
      variant: "success",
      trend: monthTrend(monthCollections, prevCollections),
    },
    {
      title: "Expenses",
      value: formatPkr(monthExpenses),
      hint: "Posted cash-book expenses",
      href: "/cash-book",
      icon: TrendingDown,
      variant: "danger",
      trend: monthTrend(monthExpenses, prevExpenses, { lowerIsBetter: true }),
    },
    {
      title: "New Sales",
      value: formatPkr(monthSaleValue),
      hint: `${monthSales.length} sale${monthSales.length === 1 ? "" : "s"} booked`,
      href: "/reports/sales",
      icon: Handshake,
      variant: "primary",
      trend: monthTrend(monthSaleValue, prevSaleValue),
    },
    {
      title: "Net Cash Flow",
      value: formatPkr(monthNet),
      hint: "Collections − expenses",
      href: "/reports/cash-book",
      icon: ArrowLeftRight,
      variant: monthNet >= 0 ? "success" : "danger",
      trend: monthTrend(monthNet, prevNet),
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
            {selectedLabel} performance
            {isCurrentMonth ? (
              <span className="ml-2 font-normal normal-case text-muted-foreground/70">
                month to date
              </span>
            ) : null}
          </h2>
          <DashboardMonthFilter options={monthOptions} selected={selectedKey} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {monthlyTiles.map((tile) => (
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
        cashflowLabel={isCurrentMonth ? `${selectedLabel} · to date` : selectedLabel}
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
