import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
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
  const locale = await getLocale();
  const t = await getTranslations("reports");
  const tSale = await getTranslations("labels.saleStatus");
  const tCommon = await getTranslations("common");

  if (!canViewCrmReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("salesTitle")}</h1>
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
        title={t("salesTitle")}
        description={t("salesDesc")}
        filename="sales-report"
        headers={[
          t("sale"),
          tCommon("customer"),
          tCommon("society"),
          tCommon("plot"),
          t("saleValue"),
          t("collected"),
          t("outstanding"),
          tCommon("status"),
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
          { label: t("activeBookings"), value: String(active.length) },
          { label: t("cancelled"), value: String(cancelled) },
          { label: t("saleValue"), value: formatPkr(saleValue, locale) },
          { label: t("outstanding"), value: formatPkr(outstanding, locale) },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sale")}</TableHead>
              <TableHead>{tCommon("customer")}</TableHead>
              <TableHead>{t("societyPlot")}</TableHead>
              <TableHead>{t("saleValue")}</TableHead>
              <TableHead>{t("collected")}</TableHead>
              <TableHead>{t("outstanding")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.code}</TableCell>
                  <TableCell>{row.customer?.full_name ?? tCommon("dash")}</TableCell>
                  <TableCell>
                    {row.society?.name ?? tCommon("dash")} · {row.plot_no}
                  </TableCell>
                  <TableCell>{formatPkr(row.sale_amount, locale)}</TableCell>
                  <TableCell>{formatPkr(row.collected, locale)}</TableCell>
                  <TableCell>{formatPkr(row.remaining_amount, locale)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tSale(row.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("noSales")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
