import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canViewCrmReports, deriveInstallmentStatus } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { roundMoney } from "@/lib/installments";
import { formatPkr } from "@/lib/format";
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

export default async function CustomerLedgerReportPage() {
  const { profile } = await requireProfile();

  if (!canViewCrmReports(profile.role)) {
    return <Denied href="/reports" />;
  }

  const supabase = await createClient();
  const [{ data: customers }, { data: sales }, { data: receipts }, { data: installments }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, code, full_name, phone, stage")
        .order("full_name"),
      supabase
        .from("sales")
        .select("id, customer_id, sale_amount, remaining_amount, status")
        .neq("status", "cancelled"),
      supabase.from("receipts").select("customer_id, amount"),
      supabase
        .from("installments")
        .select("due_date, scheduled_amount, received_amount, sales(customer_id)"),
    ]);

  const rows = (customers ?? []).map((customer) => {
    const customerSales = (sales ?? []).filter((row) => row.customer_id === customer.id);
    const saleValue = customerSales.reduce((sum, row) => sum + Number(row.sale_amount), 0);
    const remaining = customerSales.reduce(
      (sum, row) => sum + Number(row.remaining_amount),
      0,
    );
    const collected = (receipts ?? [])
      .filter((row) => row.customer_id === customer.id)
      .reduce((sum, row) => sum + Number(row.amount), 0);

    let overdue = 0;
    for (const installment of installments ?? []) {
      const sale = Array.isArray(installment.sales)
        ? installment.sales[0]
        : installment.sales;
      if (sale?.customer_id !== customer.id) {
        continue;
      }
      const status = deriveInstallmentStatus(
        installment.due_date,
        Number(installment.scheduled_amount),
        Number(installment.received_amount),
      );
      if (status === "overdue") {
        overdue += Math.max(
          0,
          Number(installment.scheduled_amount) - Number(installment.received_amount),
        );
      }
    }

    return {
      ...customer,
      saleValue: roundMoney(saleValue),
      collected: roundMoney(collected),
      remaining: roundMoney(remaining),
      overdue: roundMoney(overdue),
    };
  });

  const totals = {
    saleValue: roundMoney(rows.reduce((sum, row) => sum + row.saleValue, 0)),
    collected: roundMoney(rows.reduce((sum, row) => sum + row.collected, 0)),
    remaining: roundMoney(rows.reduce((sum, row) => sum + row.remaining, 0)),
    overdue: roundMoney(rows.reduce((sum, row) => sum + row.overdue, 0)),
  };

  const csvRows = rows.map((row) => [
    row.code,
    row.full_name,
    row.phone,
    row.saleValue,
    row.collected,
    row.remaining,
    row.overdue,
  ]);

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Customer ledger"
        description="Sale value, posted receipts, remaining balance and overdue EMI by customer."
        filename="customer-ledger"
        headers={[
          "Customer ID",
          "Name",
          "Phone",
          "Sale value",
          "Receipts",
          "Remaining",
          "Overdue",
        ]}
        rows={csvRows}
      />
      <ReportTotals
        items={[
          { label: "Sale value", value: formatPkr(totals.saleValue) },
          { label: "Receipts", value: formatPkr(totals.collected) },
          { label: "Remaining", value: formatPkr(totals.remaining) },
          { label: "Overdue EMI", value: formatPkr(totals.overdue) },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Sale value</TableHead>
              <TableHead>Receipts</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Overdue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/customers/${row.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.full_name}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {row.code}
                    </span>
                  </TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{formatPkr(row.saleValue)}</TableCell>
                  <TableCell>{formatPkr(row.collected)}</TableCell>
                  <TableCell>{formatPkr(row.remaining)}</TableCell>
                  <TableCell>{formatPkr(row.overdue)}</TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRow />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
        No customer ledger rows yet.
      </TableCell>
    </TableRow>
  );
}

function Denied({ href }: { href: string }) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Report</h1>
      <p className="text-sm text-muted-foreground">
        You do not have permission to view this report.
      </p>
      <Button render={<Link href={href} />} variant="outline">
        Back
      </Button>
    </div>
  );
}
