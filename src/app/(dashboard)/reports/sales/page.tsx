import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canViewCrmReports } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { roundMoney } from "@/lib/installments";
import { SALE_STATUS_LABELS } from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import { ReportHeader, ReportTotals } from "@/components/features/report-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SalesReportPage() {
  const { profile } = await requireProfile();

  if (!canViewCrmReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Sales report</h1>
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
  const { data: sales } = await supabase
    .from("sales")
    .select(
      "id, code, plot_no, sale_amount, remaining_amount, token_amount, status, customers(full_name, code), societies(name)",
    )
    .order("created_at", { ascending: false });

  const rows = (sales ?? []).map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    const society = Array.isArray(row.societies) ? row.societies[0] : row.societies;
    const collected = roundMoney(Number(row.sale_amount) - Number(row.remaining_amount));
    return { ...row, customer, society, collected };
  });

  const active = rows.filter((row) => row.status !== "cancelled");
  const cancelled = rows.filter((row) => row.status === "cancelled").length;
  const saleValue = roundMoney(active.reduce((sum, row) => sum + Number(row.sale_amount), 0));
  const collected = roundMoney(active.reduce((sum, row) => sum + row.collected, 0));
  const outstanding = roundMoney(
    active.reduce((sum, row) => sum + Number(row.remaining_amount), 0),
  );

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Sales & collections"
        description="Bookings, sale value, collections and outstanding balances."
        filename="sales-report"
        headers={[
          "Sale",
          "Customer",
          "Society",
          "Plot",
          "Sale value",
          "Collected",
          "Outstanding",
          "Status",
        ]}
        rows={rows.map((row) => [
          row.code,
          row.customer?.full_name ?? "",
          row.society?.name ?? "",
          row.plot_no,
          row.sale_amount,
          row.collected,
          row.remaining_amount,
          row.status,
        ])}
      />
      <ReportTotals
        items={[
          { label: "Active bookings", value: String(active.length) },
          { label: "Cancelled", value: String(cancelled) },
          { label: "Sale value", value: formatPkr(saleValue) },
          { label: "Outstanding", value: formatPkr(outstanding) },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Society / plot</TableHead>
              <TableHead>Sale value</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.code}</TableCell>
                  <TableCell>{row.customer?.full_name ?? "—"}</TableCell>
                  <TableCell>
                    {row.society?.name ?? "—"} · {row.plot_no}
                  </TableCell>
                  <TableCell>{formatPkr(row.sale_amount)}</TableCell>
                  <TableCell>{formatPkr(row.collected)}</TableCell>
                  <TableCell>{formatPkr(row.remaining_amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{SALE_STATUS_LABELS[row.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No sales yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
