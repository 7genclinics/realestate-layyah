import Link from "next/link";
import { addDays, format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { canViewCrmReports, deriveInstallmentStatus } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { roundMoney } from "@/lib/installments";
import { INSTALLMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { ReportHeader, ReportTotals } from "@/components/features/report-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InstallmentDueReportPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const { profile } = await requireProfile();
  const { window: selected = "overdue" } = await searchParams;

  if (!canViewCrmReports(profile.role)) {
    return <Denied />;
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("installments")
    .select(
      "id, installment_no, period_label, due_date, scheduled_amount, received_amount, sales(id, code, plot_no, customer_id, society_id, customers(full_name, code), societies(name))",
    )
    .order("due_date");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon =
    selected === "today"
      ? 0
      : selected === "7"
        ? 7
        : selected === "15"
          ? 15
          : selected === "30"
            ? 30
            : null;

  const items = (rows ?? [])
    .map((row) => {
      const sale = Array.isArray(row.sales) ? row.sales[0] : row.sales;
      const customer = Array.isArray(sale?.customers)
        ? sale?.customers[0]
        : sale?.customers;
      const society = Array.isArray(sale?.societies)
        ? sale?.societies[0]
        : sale?.societies;
      const open = roundMoney(
        Number(row.scheduled_amount) - Number(row.received_amount),
      );
      const status = deriveInstallmentStatus(
        row.due_date,
        Number(row.scheduled_amount),
        Number(row.received_amount),
      );

      return { ...row, sale, customer, society, open, status };
    })
    .filter((row) => row.open > 0)
    .filter((row) => {
      const due = new Date(`${row.due_date}T00:00:00`);
      if (selected === "overdue") {
        return row.status === "overdue";
      }
      if (horizon === 0) {
        return due.getTime() === today.getTime();
      }
      if (horizon) {
        const until = addDays(today, horizon);
        return due >= today && due <= until;
      }
      return true;
    });

  const totalOpen = roundMoney(items.reduce((sum, row) => sum + row.open, 0));
  const csvRows = items.map((row) => [
    row.customer?.full_name ?? "",
    row.sale?.code ?? "",
    row.sale?.plot_no ?? "",
    row.society?.name ?? "",
    row.period_label,
    row.due_date,
    row.open,
    row.status,
  ]);

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Installment due"
        description="Open EMI amounts due today, upcoming, or already overdue."
        filename={`installments-${selected}`}
        headers={[
          "Customer",
          "Sale",
          "Plot",
          "Society",
          "Period",
          "Due",
          "Open amount",
          "Status",
        ]}
        rows={csvRows}
      >
        <div className="flex flex-wrap gap-2">
          <Filter href="/reports/installments?window=overdue" active={selected === "overdue"}>
            Overdue
          </Filter>
          <Filter href="/reports/installments?window=today" active={selected === "today"}>
            Due today
          </Filter>
          <Filter href="/reports/installments?window=7" active={selected === "7"}>
            Next 7 days
          </Filter>
          <Filter href="/reports/installments?window=15" active={selected === "15"}>
            Next 15 days
          </Filter>
          <Filter href="/reports/installments?window=30" active={selected === "30"}>
            Next 30 days
          </Filter>
        </div>
      </ReportHeader>
      <ReportTotals
        items={[
          { label: "Installments", value: String(items.length) },
          { label: "Open amount", value: formatPkr(totalOpen) },
          { label: "As of", value: format(today, "dd MMM yyyy") },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Sale / plot</TableHead>
              <TableHead>Society</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Open</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length ? (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.sale?.customer_id ? (
                      <Link
                        href={`/customers/${row.sale.customer_id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {row.customer?.full_name ?? "—"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {row.sale?.code} · {row.sale?.plot_no}
                  </TableCell>
                  <TableCell>{row.society?.name ?? "—"}</TableCell>
                  <TableCell>{row.period_label}</TableCell>
                  <TableCell>{formatDate(row.due_date)}</TableCell>
                  <TableCell>{formatPkr(row.open)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === "overdue" ? "destructive" : "secondary"}
                    >
                      {INSTALLMENT_STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No installments in this window.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Filter({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
          : "rounded-full border px-3 py-1 text-sm"
      }
    >
      {children}
    </Link>
  );
}

function Denied() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Installment due</h1>
      <p className="text-sm text-muted-foreground">
        You do not have permission to view this report.
      </p>
      <Button render={<Link href="/reports" />} variant="outline">
        Back
      </Button>
    </div>
  );
}
