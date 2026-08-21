import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canViewCrmReports, deriveInstallmentStatus } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { daysOverdue } from "@/lib/csv";
import { roundMoney } from "@/lib/installments";
import { formatDate, formatPkr } from "@/lib/format";
import { ReportHeader, ReportTotals } from "@/components/features/report-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BUCKETS = [
  { id: "1-30", label: "1–30 days", min: 1, max: 30 },
  { id: "31-60", label: "31–60 days", min: 31, max: 60 },
  { id: "61-90", label: "61–90 days", min: 61, max: 90 },
  { id: "90+", label: "90+ days", min: 91, max: Number.POSITIVE_INFINITY },
] as const;

export default async function AgingReportPage() {
  const { profile } = await requireProfile();

  if (!canViewCrmReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Installment aging</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view this report.
        </p>
        <Button render={<Link href="/reports" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("installments")
    .select(
      "id, period_label, due_date, scheduled_amount, received_amount, sales(code, plot_no, customer_id, customers(full_name))",
    )
    .order("due_date");

  const overdue = (rows ?? [])
    .map((row) => {
      const sale = Array.isArray(row.sales) ? row.sales[0] : row.sales;
      const customer = Array.isArray(sale?.customers)
        ? sale?.customers[0]
        : sale?.customers;
      const open = roundMoney(
        Number(row.scheduled_amount) - Number(row.received_amount),
      );
      const status = deriveInstallmentStatus(
        row.due_date,
        Number(row.scheduled_amount),
        Number(row.received_amount),
      );
      const days = daysOverdue(row.due_date);

      return { ...row, sale, customer, open, status, days };
    })
    .filter((row) => row.status === "overdue" && row.open > 0);

  const summaries = BUCKETS.map((bucket) => {
    const bucketRows = overdue.filter(
      (row) => row.days >= bucket.min && row.days <= bucket.max,
    );
    return {
      ...bucket,
      count: bucketRows.length,
      amount: roundMoney(bucketRows.reduce((sum, row) => sum + row.open, 0)),
    };
  });

  const csvRows = overdue.map((row) => [
    row.customer?.full_name ?? "",
    row.sale?.code ?? "",
    row.sale?.plot_no ?? "",
    row.period_label,
    row.due_date,
    row.days,
    row.open,
  ]);

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Installment aging"
        description="Overdue EMI grouped into 1–30, 31–60, 61–90 and 90+ day buckets."
        filename="installment-aging"
        headers={[
          "Customer",
          "Sale",
          "Plot",
          "Period",
          "Due",
          "Days overdue",
          "Open amount",
        ]}
        rows={csvRows}
      />
      <ReportTotals
        items={summaries.map((bucket) => ({
          label: `${bucket.label} (${bucket.count})`,
          value: formatPkr(bucket.amount),
        }))}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Sale / plot</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overdue.length ? (
              overdue.map((row) => (
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
                  <TableCell>{row.period_label}</TableCell>
                  <TableCell>{formatDate(row.due_date)}</TableCell>
                  <TableCell>{row.days}</TableCell>
                  <TableCell>{formatPkr(row.open)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No overdue installments.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
