import Link from "next/link";
import { format, startOfMonth } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canViewFinancialReports } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  summarizeDay,
  transactionSignedAmount,
} from "@/lib/cash-book";
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

export default async function CashBookReportPage({
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
        <h1 className="text-2xl font-semibold">{t("cashTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
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
      "id, transaction_date, transaction_type, transfer_side, amount, status, cash_account_id, cash_categories(name, group_name), societies(name)",
    )
    .eq("status", "posted")
    .gte("transaction_date", from)
    .lte("transaction_date", to)
    .order("transaction_date");

  const periodRows = (transactions ?? []).map((row) => ({
    ...row,
    category: Array.isArray(row.cash_categories)
      ? row.cash_categories[0]
      : row.cash_categories,
    society: Array.isArray(row.societies) ? row.societies[0] : row.societies,
  }));

  const grouped = new Map<
    string,
    { category: string; society: string; income: number; expense: number }
  >();

  for (const row of periodRows) {
    if (row.transaction_type === "transfer") {
      continue;
    }
    const key = `${row.category?.name ?? t("uncategorised")}|${row.society?.name ?? t("allProjects")}`;
    const current = grouped.get(key) ?? {
      category: row.category?.name ?? t("uncategorised"),
      society: row.society?.name ?? t("allProjects"),
      income: 0,
      expense: 0,
    };
    const signed = transactionSignedAmount({
      transaction_type: row.transaction_type,
      transfer_side: row.transfer_side,
      amount: Number(row.amount),
      status: row.status,
    });
    if (signed > 0) {
      current.income = roundMoney(current.income + signed);
    } else if (signed < 0) {
      current.expense = roundMoney(current.expense + Math.abs(signed));
    } else {
      continue;
    }
    grouped.set(key, current);
  }

  const tableRows = [...grouped.values()];
  const income = roundMoney(tableRows.reduce((sum, row) => sum + row.income, 0));
  const expense = roundMoney(tableRows.reduce((sum, row) => sum + row.expense, 0));
  const todaySummary = summarizeDay(to, periodRows);

  return (
    <div className="space-y-6">
      <ReportHeader
        title={t("cashTitle")}
        description={t("cashDescPeriod", { from, to })}
        filename={`cash-book-${from}-to-${to}`}
        headers={[t("csvCategory"), tCommon("society"), t("income"), t("expense"), t("net")]}
        rows={tableRows.map((row) => [
          row.category,
          row.society,
          row.income,
          row.expense,
          roundMoney(row.income - row.expense),
        ])}
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
      <ReportTotals
        items={[
          { label: t("income"), value: formatPkr(income, locale) },
          { label: t("expense"), value: formatPkr(expense, locale) },
          { label: t("netCashFlow"), value: formatPkr(income - expense, locale) },
          {
            label: t("endDate", { date: to }),
            value: formatPkr(todaySummary.net, locale),
          },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        {t("endDateHint", {
          income: formatPkr(todaySummary.income, locale),
          expense: formatPkr(todaySummary.expense, locale),
        })}
      </p>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("csvCategory")}</TableHead>
              <TableHead>{tCommon("society")}</TableHead>
              <TableHead>{t("income")}</TableHead>
              <TableHead>{t("expense")}</TableHead>
              <TableHead>{t("net")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.length ? (
              tableRows.map((row) => (
                <TableRow key={`${row.category}-${row.society}`}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.society}</TableCell>
                  <TableCell>{formatPkr(row.income, locale)}</TableCell>
                  <TableCell>{formatPkr(row.expense, locale)}</TableCell>
                  <TableCell>{formatPkr(row.income - row.expense, locale)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("noCashEntries")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
