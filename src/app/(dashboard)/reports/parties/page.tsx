import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canViewFinancialReports } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { roundMoney } from "@/lib/installments";
import { PARTY_TYPE_LABELS } from "@/lib/constants";
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

export default async function PartiesReportPage() {
  const { profile } = await requireProfile();
  const locale = await getLocale();
  const t = await getTranslations("reports");
  const tType = await getTranslations("labels.partyType");
  const tCommon = await getTranslations("common");

  if (!canViewFinancialReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("partiesTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("noPermission")}</p>
        <Button render={<Link href="/reports" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: parties }, { data: contracts }] = await Promise.all([
    supabase.from("parties").select("id, code, name, party_type, opening_balance").order("name"),
    supabase
      .from("contracts")
      .select("party_id, contract_value, paid_amount, remaining_amount, status")
      .neq("status", "cancelled"),
  ]);

  const rows = (parties ?? []).map((party) => {
    const partyContracts = (contracts ?? []).filter((row) => row.party_id === party.id);
    const value = partyContracts.reduce((sum, row) => sum + Number(row.contract_value), 0);
    const paid = partyContracts.reduce((sum, row) => sum + Number(row.paid_amount), 0);
    const remaining = roundMoney(
      Number(party.opening_balance) +
        partyContracts.reduce((sum, row) => sum + Number(row.remaining_amount), 0),
    );
    return {
      ...party,
      value: roundMoney(value),
      paid: roundMoney(paid),
      remaining,
    };
  });

  return (
    <div className="space-y-6">
      <ReportHeader
        title={t("partiesLedgerTitle")}
        description={t("partiesLedgerDesc")}
        filename="party-ledger"
        headers={[t("partyId"), tCommon("name"), tCommon("type"), t("contractValue"), t("paid"), t("payable")]}
        rows={rows.map((row) => [
          row.code,
          row.name,
          tType(row.party_type),
          row.value,
          row.paid,
          row.remaining,
        ])}
      />
      <ReportTotals
        items={[
          {
            label: t("contractValue"),
            value: formatPkr(rows.reduce((sum, row) => sum + row.value, 0), locale),
          },
          {
            label: t("paid"),
            value: formatPkr(rows.reduce((sum, row) => sum + row.paid, 0), locale),
          },
          {
            label: t("payable"),
            value: formatPkr(rows.reduce((sum, row) => sum + row.remaining, 0), locale),
          },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("party")}</TableHead>
              <TableHead>{tCommon("type")}</TableHead>
              <TableHead>{t("contractValue")}</TableHead>
              <TableHead>{t("paid")}</TableHead>
              <TableHead>{t("payable")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/parties/${row.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.name}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {row.code}
                    </span>
                  </TableCell>
                  <TableCell>{tType(row.party_type)}</TableCell>
                  <TableCell>{formatPkr(row.value, locale)}</TableCell>
                  <TableCell>{formatPkr(row.paid, locale)}</TableCell>
                  <TableCell>{formatPkr(row.remaining, locale)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("noParties")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
