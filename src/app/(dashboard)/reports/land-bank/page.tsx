import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import {
  canManageLandBank,
  canViewFinancialReports,
} from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { roundMoney } from "@/lib/installments";
import {
  AREA_UNIT_LABELS,
  LAND_ACQUISITION_LABELS,
  LAND_STATUS_LABELS,
} from "@/lib/constants";
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

export default async function LandBankReportPage() {
  const { profile } = await requireProfile();
  const locale = await getLocale();
  const t = await getTranslations("reports");
  const tAcq = await getTranslations("labels.landAcquisition");
  const tStatus = await getTranslations("labels.landStatus");
  const tUnit = await getTranslations("labels.areaUnit");
  const tCommon = await getTranslations("common");

  if (!canViewFinancialReports(profile.role) && !canManageLandBank(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("landLedgerTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("noPermission")}</p>
        <Button render={<Link href="/reports" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: parcels } = await supabase
    .from("land_parcels")
    .select(
      "id, code, title, area, area_unit, purchase_value, paid_amount, remaining_amount, status, acquisition_type, khasra, parties(name, code), societies(name)",
    )
    .order("created_at", { ascending: false });

  const rows = (parcels ?? []).map((row) => ({
    ...row,
    party: Array.isArray(row.parties) ? row.parties[0] : row.parties,
    society: Array.isArray(row.societies) ? row.societies[0] : row.societies,
  }));

  const open = rows.filter((row) => row.status !== "transferred");
  const value = roundMoney(open.reduce((sum, row) => sum + Number(row.purchase_value), 0));
  const paid = roundMoney(open.reduce((sum, row) => sum + Number(row.paid_amount), 0));
  const remaining = roundMoney(
    open.reduce((sum, row) => sum + Number(row.remaining_amount), 0),
  );

  return (
    <div className="space-y-6">
      <ReportHeader
        title={t("landLedgerTitle")}
        description={t("landLedgerDesc")}
        filename="land-acquisition-ledger"
        headers={[
          t("landId"),
          tCommon("description"),
          tCommon("society"),
          t("landlord"),
          tCommon("type"),
          t("area"),
          t("khasra"),
          t("value"),
          t("paid"),
          t("payable"),
          tCommon("status"),
        ]}
        rows={rows.map((row) => [
          row.code,
          row.title,
          row.society?.name ?? "",
          row.party?.name ?? "",
          row.acquisition_type,
          `${row.area} ${row.area_unit}`,
          row.khasra ?? "",
          row.purchase_value,
          row.paid_amount,
          row.remaining_amount,
          row.status,
        ])}
      />
      <ReportTotals
        items={[
          { label: t("acquisitionValue"), value: formatPkr(value, locale) },
          { label: t("paid"), value: formatPkr(paid, locale) },
          { label: t("payable"), value: formatPkr(remaining, locale) },
          { label: t("records"), value: String(rows.length) },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("land")}</TableHead>
              <TableHead>{t("societyLandlord")}</TableHead>
              <TableHead>{t("area")}</TableHead>
              <TableHead>{t("value")}</TableHead>
              <TableHead>{t("paid")}</TableHead>
              <TableHead>{t("payable")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/land-bank/${row.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.title}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {row.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.society?.name ?? tCommon("dash")}
                    <div className="text-xs text-muted-foreground">
                      {row.party?.name ?? tAcq(row.acquisition_type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.area} {tUnit(row.area_unit)}
                  </TableCell>
                  <TableCell>{formatPkr(row.purchase_value, locale)}</TableCell>
                  <TableCell>{formatPkr(row.paid_amount, locale)}</TableCell>
                  <TableCell>{formatPkr(row.remaining_amount, locale)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tStatus(row.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("noLand")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
