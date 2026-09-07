import Link from "next/link";
import { format, startOfMonth } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
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
  const locale = await getLocale();
  const t = await getTranslations("reports");
  const tCommon = await getTranslations("common");

  if (!canViewFinancialReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("devTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("noPermission")}</p>
        <Button render={<Link href="/reports" />} variant="outline">
          {tCommon("back")}
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
    const key = `${row.society?.name ?? t("allProjects")}|${row.category?.name ?? t("devTitle")}`;
    const current = grouped.get(key) ?? {
      society: row.society?.name ?? t("allProjects"),
      category: row.category?.name ?? t("devTitle"),
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
        title={t("devTitle")}
        description={t("devDesc")}
        filename={`development-${from}-to-${to}`}
        headers={[tCommon("society"), t("csvCategory"), tCommon("amount")]}
        rows={tableRows.map((row) => [row.society, row.category, row.amount])}
      >
        <form className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted-foreground">
            {tCommon("from")}
            <input
              name="from"
              type="date"
              defaultValue={from}
              className="mt-1 block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {tCommon("to")}
            <input
              name="to"
              type="date"
              defaultValue={to}
              className="mt-1 block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
          </label>
          <Button type="submit" variant="outline">
            {tCommon("apply")}
          </Button>
        </form>
      </ReportHeader>
      <ReportTotals items={[{ label: t("totalSpend"), value: formatPkr(total, locale) }]} />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("society")}</TableHead>
              <TableHead>{t("csvCategory")}</TableHead>
              <TableHead>{tCommon("amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.length ? (
              tableRows.map((row) => (
                <TableRow key={`${row.society}-${row.category}`}>
                  <TableCell>{row.society}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{formatPkr(row.amount, locale)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("noDevSpend")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
