import Link from "next/link";
import { addDays, format } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
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
  const locale = await getLocale();
  const t = await getTranslations("reports");
  const tInst = await getTranslations("labels.installmentStatus");
  const tCommon = await getTranslations("common");

  if (!canViewCrmReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("installmentDue")}</h1>
        <p className="text-sm text-muted-foreground">{t("noPermission")}</p>
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
        title={t("installmentDue")}
        description={t("installmentDueDesc")}
        filename={`installments-${selected}`}
        headers={[
          tCommon("customer"),
          t("sale"),
          tCommon("plot"),
          tCommon("society"),
          t("period"),
          t("due"),
          t("openAmount"),
          tCommon("status"),
        ]}
        rows={csvRows}
      >
        <div className="flex flex-wrap gap-2">
          <Filter href="/reports/installments?window=overdue" active={selected === "overdue"}>
            {t("overdueFilter")}
          </Filter>
          <Filter href="/reports/installments?window=today" active={selected === "today"}>
            {t("dueToday")}
          </Filter>
          <Filter href="/reports/installments?window=7" active={selected === "7"}>
            {t("next7")}
          </Filter>
          <Filter href="/reports/installments?window=15" active={selected === "15"}>
            {t("next15")}
          </Filter>
          <Filter href="/reports/installments?window=30" active={selected === "30"}>
            {t("next30")}
          </Filter>
        </div>
      </ReportHeader>
      <ReportTotals
        items={[
          { label: t("installments"), value: String(items.length) },
          { label: t("openAmount"), value: formatPkr(totalOpen, locale) },
          { label: t("asOf"), value: format(today, "dd MMM yyyy") },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("customer")}</TableHead>
              <TableHead>{t("salePlot")}</TableHead>
              <TableHead>{tCommon("society")}</TableHead>
              <TableHead>{t("period")}</TableHead>
              <TableHead>{t("due")}</TableHead>
              <TableHead>{t("open")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
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
                        {row.customer?.full_name ?? tCommon("dash")}
                      </Link>
                    ) : (
                      tCommon("dash")
                    )}
                  </TableCell>
                  <TableCell>
                    {row.sale?.code} · {row.sale?.plot_no}
                  </TableCell>
                  <TableCell>{row.society?.name ?? tCommon("dash")}</TableCell>
                  <TableCell>{row.period_label}</TableCell>
                  <TableCell>{formatDate(row.due_date, locale)}</TableCell>
                  <TableCell>{formatPkr(row.open, locale)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === "overdue" ? "destructive" : "secondary"}
                    >
                      {tInst(row.status)}
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
                  {t("noWindow")}
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
