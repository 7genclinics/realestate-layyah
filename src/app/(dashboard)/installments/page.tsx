import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle, Receipt, ArrowRight } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { canManageCrm, deriveInstallmentStatus } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { roundMoney } from "@/lib/installments";
import { INSTALLMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { profile } = await requireProfile();
  const { filter = "due" } = await searchParams;
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("installments")
    .select(
      "id, installment_no, period_label, due_date, scheduled_amount, received_amount, sales(id, code, plot_no, customer_id, customers(full_name, code))",
    )
    .order("due_date");

  const items = (rows ?? []).map((row) => {
    const status = deriveInstallmentStatus(
      row.due_date,
      Number(row.scheduled_amount),
      Number(row.received_amount),
    );
    const sale = Array.isArray(row.sales) ? row.sales[0] : row.sales;
    const customer = Array.isArray(sale?.customers)
      ? sale?.customers[0]
      : sale?.customers;

    return { ...row, status, sale, customer };
  });

  const overdueItems = items.filter((i) => i.status === "overdue");
  const overdueTotal = overdueItems.reduce((s, i) => s + (Number(i.scheduled_amount) - Number(i.received_amount)), 0);

  const dueItems = items.filter((i) => i.status === "due");
  const dueTotal = dueItems.reduce((s, i) => s + (Number(i.scheduled_amount) - Number(i.received_amount)), 0);

  const paidItems = items.filter((i) => i.status === "paid");

  const filtered =
    filter === "all"
      ? items
      : filter === "overdue"
        ? overdueItems
        : items.filter((item) => item.status === "due" || item.status === "overdue");

  const canEdit = canManageCrm(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Installments &amp; Collections</h1>
          <p className="text-sm text-muted-foreground">
            Monitor plot installment schedules, upcoming milestone dues, and overdue collection recoveries.
          </p>
        </div>
        <Button render={<Link href="/receipts/new" />}>
          <Receipt className="size-4" />
          Receive Payment
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Overdue Installments"
          value={overdueItems.length}
          hint={`${formatPkr(overdueTotal)} total recovery amount`}
          icon={AlertTriangle}
          variant="danger"
          href="/installments?filter=overdue"
        />
        <StatCard
          title="Due Milestones"
          value={dueItems.length}
          hint={`${formatPkr(dueTotal)} scheduled dues`}
          icon={CalendarClock}
          variant="warning"
          href="/installments?filter=due"
        />
        <StatCard
          title="Paid Installments"
          value={paidItems.length}
          hint="Fully cleared milestone payments"
          icon={CheckCircle}
          variant="success"
          href="/receipts"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <FilterLink href="/installments?filter=due" active={filter === "due"}>
          Due &amp; Overdue ({dueItems.length + overdueItems.length})
        </FilterLink>
        <FilterLink
          href="/installments?filter=overdue"
          active={filter === "overdue"}
        >
          Overdue Only ({overdueItems.length})
        </FilterLink>
        <FilterLink href="/installments?filter=all" active={filter === "all"}>
          All Milestones ({items.length})
        </FilterLink>
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <h2 className="font-semibold text-sm">Installment Schedule Ledger</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} installment records</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Booking / Plot</TableHead>
              <TableHead>Period Milestone</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              {canEdit ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} className="py-10 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : filtered.length ? (
              filtered.map((row) => {
                const openAmount = roundMoney(
                  Number(row.scheduled_amount) - Number(row.received_amount),
                );

                return (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      {row.customer ? (
                        <Link
                          href={`/customers/${row.sale?.customer_id}`}
                          className="font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          {row.customer.full_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.sale?.plot_no ?? "—"}</div>
                      <div className="font-mono text-xs text-muted-foreground">{row.sale?.code}</div>
                    </TableCell>
                    <TableCell>{row.period_label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(row.due_date)}</TableCell>
                    <TableCell className="font-semibold">{formatPkr(row.scheduled_amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={row.status === "overdue" ? "destructive" : "secondary"}
                        className="rounded-md font-normal"
                      >
                        {INSTALLMENT_STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                    {canEdit ? (
                      <TableCell className="text-right">
                        {openAmount > 0 && row.sale ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-md"
                            render={
                              <Link
                                href={`/receipts/new?sale=${row.sale.id}&installment=${row.id}`}
                              />
                            }
                          >
                            Receive
                            <ArrowRight className="size-3 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Cleared</span>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 7 : 6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No installments in this view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors"
          : "rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
      }
    >
      {children}
    </Link>
  );
}
