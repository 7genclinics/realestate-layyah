import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
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
  { id: "1-30", key: "bucket130" as const, min: 1, max: 30 },
  { id: "31-60", key: "bucket3160" as const, min: 31, max: 60 },
  { id: "61-90", key: "bucket6190" as const, min: 61, max: 90 },
  { id: "90+", key: "bucket90" as const, min: 91, max: Number.POSITIVE_INFINITY },
] as const;

export default async function AgingReportPage() {
  const { profile } = await requireProfile();
  const locale = await getLocale();
  const t = await getTranslations("reports");
  const tCommon = await getTranslations("common");

  if (!canViewCrmReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("agingTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/reports" />} variant="outline">
          {tCommon("back")}
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
      label: t(bucket.key),
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
        title={t("agingTitle")}
        description={t("agingDesc")}
        filename="installment-aging"
        headers={[
          tCommon("customer"),
          t("sale"),
          tCommon("plot"),
          t("period"),
          t("due"),
          t("daysOverdue"),
          t("openAmount"),
        ]}
        rows={csvRows}
      />
      <ReportTotals
        items={summaries.map((bucket) => ({
          label: `${bucket.label} (${bucket.count})`,
          value: formatPkr(bucket.amount, locale),
        }))}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("customer")}</TableHead>
              <TableHead>{t("salePlot")}</TableHead>
              <TableHead>{t("period")}</TableHead>
              <TableHead>{t("due")}</TableHead>
              <TableHead>{t("days")}</TableHead>
              <TableHead>{t("open")}</TableHead>
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
                        {row.customer?.full_name ?? tCommon("dash")}
                      </Link>
                    ) : (
                      tCommon("dash")
                    )}
                  </TableCell>
                  <TableCell>
                    {row.sale?.code} · {row.sale?.plot_no}
                  </TableCell>
                  <TableCell>{row.period_label}</TableCell>
                  <TableCell>{formatDate(row.due_date, locale)}</TableCell>
                  <TableCell>{row.days}</TableCell>
                  <TableCell>{formatPkr(row.open, locale)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("noOverdue")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
