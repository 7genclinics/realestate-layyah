import Link from "next/link";
import { format, startOfMonth } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { canViewFinancialReports } from "@/lib/permissions";
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

export default async function DevelopmentReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;

  if (!canViewFinancialReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Development cost</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view this report.
        </p>
        <Button render={<Link href="/reports" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const to = params.to ?? format(new Date(), "yyyy-MM-dd");
  const from = params.from ?? format(startOfMonth(new Date()), "yyyy-MM-dd");
  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from("cash_transactions")
    .select(
      "amount, transaction_type, cash_categories(name, group_name), societies(name)",
    )
    .eq("status", "posted")
    .eq("transaction_type", "expense")
    .gte("transaction_date", from)
    .lte("transaction_date", to);

  const rows = (transactions ?? [])
    .map((row) => ({
      ...row,
      category: Array.isArray(row.cash_categories)
        ? row.cash_categories[0]
        : row.cash_categories,
      society: Array.isArray(row.societies) ? row.societies[0] : row.societies,
    }))
    .filter((row) => {
      const group = row.category?.group_name ?? "";
      const name = row.category?.name ?? "";
      return (
        group === "Development" ||
        name === "Society development" ||
        name === "Contractor payment" ||
        name === "Land purchase"
      );
    });

  const grouped = new Map<
    string,
    { society: string; category: string; amount: number }
  >();

  for (const row of rows) {
    const key = `${row.society?.name ?? "All projects"}|${row.category?.name ?? "Development"}`;
    const current = grouped.get(key) ?? {
      society: row.society?.name ?? "All projects",
      category: row.category?.name ?? "Development",
      amount: 0,
    };
    grouped.set(key, {
      ...current,
      amount: roundMoney(current.amount + Number(row.amount)),
    });
  }

  const tableRows = [...grouped.values()];
  const total = roundMoney(tableRows.reduce((sum, row) => sum + row.amount, 0));

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Development cost"
        description="Society development, contractor and land-purchase expenses by project."
        filename={`development-${from}-to-${to}`}
        headers={["Society", "Category", "Amount"]}
        rows={tableRows.map((row) => [row.society, row.category, row.amount])}
      >
        <form className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted-foreground">
            From
            <input
              name="from"
              type="date"
              defaultValue={from}
              className="mt-1 block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            To
            <input
              name="to"
              type="date"
              defaultValue={to}
              className="mt-1 block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
          </label>
          <Button type="submit" variant="outline">
            Apply
          </Button>
        </form>
      </ReportHeader>
      <ReportTotals items={[{ label: "Total spend", value: formatPkr(total) }]} />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Society</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.length ? (
              tableRows.map((row) => (
                <TableRow key={`${row.society}-${row.category}`}>
                  <TableCell>{row.society}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{formatPkr(row.amount)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  No development spend in this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
