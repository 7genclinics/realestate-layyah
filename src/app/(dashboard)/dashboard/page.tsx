import Link from "next/link";
import { eachDayOfInterval, format, startOfMonth, subDays } from "date-fns";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/server";
import { deriveInstallmentStatus } from "@/lib/permissions";
import { summarizeDay, sumBalancesByAccountType } from "@/lib/cash-book";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import type { PropertyStatus } from "@/lib/database.types";
import { formatPkr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatCard, type StatCardProps } from "@/components/ui/stat-card";
import {
  DashboardCharts,
  type CashflowPoint,
  type InventorySlice,
} from "@/components/features/dashboard-charts";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const rangeStart = format(subDays(new Date(), 13), "yyyy-MM-dd");
  const monthStart = startOfMonth(new Date()).toISOString();

  const [
    { count: societyCount },
    { data: properties },
    { data: receiptRows },
    { data: installmentRows },
    { data: cashAccounts },
    { data: cashTransactions },
    { data: salesRows },
  ] = await Promise.all([
    supabase.from("societies").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("status"),
    supabase
      .from("receipts")
      .select("amount, payment_date")
      .gte("payment_date", rangeStart)
      .lte("payment_date", today),
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
  ]);

  const todayCollections = (receiptRows ?? [])
    .filter((row) => row.payment_date === today)
    .reduce((sum, row) => sum + Number(row.amount), 0);

  const mappedCash = (cashTransactions ?? []).map((row) => ({
    cash_account_id: row.cash_account_id,
    transaction_date: row.transaction_date,
    transaction_type: row.transaction_type,
    transfer_side: row.transfer_side,
    amount: Number(row.amount),
    status: row.status,
  }));

  const todayCashSummary = summarizeDay(today, mappedCash);
  const { cashTotal, bankTotal } = sumBalancesByAccountType(
    cashAccounts ?? [],
    mappedCash,
  );

  let overdueCount = 0;
  let overdueAmount = 0;
  let dueSoonCount = 0;
  const dueSoonLimit = new Date();
  dueSoonLimit.setDate(dueSoonLimit.getDate() + 7);

  for (const row of installmentRows ?? []) {
    const scheduled = Number(row.scheduled_amount);
    const received = Number(row.received_amount);
    const status = deriveInstallmentStatus(row.due_date, scheduled, received);

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
    start: subDays(new Date(), 13),
    end: new Date(),
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

  const monthSales = (salesRows ?? []).filter(
    (row) => row.created_at >= monthStart && row.status !== "cancelled",
  );
  const monthSaleValue = monthSales.reduce(
    (sum, row) => sum + Number(row.sale_amount),
    0,
  );
  const receivable = (salesRows ?? [])
    .filter((row) => row.status !== "cancelled" && row.status !== "closed")
    .reduce((sum, row) => sum + Number(row.remaining_amount), 0);

  const unitCount = properties?.length ?? 0;

  const kpis: StatCardProps[] = [
    {
      title: "Today Collections",
      value: formatPkr(todayCollections),
      hint: "Receipts posted today",
      href: "/receipts",
      icon: TrendingUp,
      variant: "success",
    },
    {
      title: "Today Expenses",
      value: formatPkr(todayCashSummary.expense),
      hint: "Posted cash-book expenses",
      href: "/cash-book",
      icon: TrendingDown,
      variant: "danger",
    },
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`${format(new Date(), "EEEE, d MMMM yyyy")} · ${societyCount ?? 0} societ${(societyCount ?? 0) === 1 ? "y" : "ies"} · ${unitCount} units · Receivable ${formatPkr(receivable)} · This month ${monthSales.length} sales (${formatPkr(monthSaleValue)})`}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <DashboardCharts cashflow={cashflow} inventory={inventory} />

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
