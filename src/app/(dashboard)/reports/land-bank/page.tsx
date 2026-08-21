import Link from "next/link";
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

  if (!canViewFinancialReports(profile.role) && !canManageLandBank(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Land acquisition ledger</h1>
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
        title="Land acquisition ledger"
        description="Purchase value, payments and remaining balance by land record."
        filename="land-acquisition-ledger"
        headers={[
          "Land ID",
          "Description",
          "Society",
          "Landlord",
          "Type",
          "Area",
          "Khasra",
          "Value",
          "Paid",
          "Payable",
          "Status",
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
          { label: "Acquisition value", value: formatPkr(value) },
          { label: "Paid", value: formatPkr(paid) },
          { label: "Payable", value: formatPkr(remaining) },
          { label: "Records", value: String(rows.length) },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Land</TableHead>
              <TableHead>Society / landlord</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Payable</TableHead>
              <TableHead>Status</TableHead>
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
                    {row.society?.name ?? "—"}
                    <div className="text-xs text-muted-foreground">
                      {row.party?.name ?? LAND_ACQUISITION_LABELS[row.acquisition_type]}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.area} {AREA_UNIT_LABELS[row.area_unit]}
                  </TableCell>
                  <TableCell>{formatPkr(row.purchase_value)}</TableCell>
                  <TableCell>{formatPkr(row.paid_amount)}</TableCell>
                  <TableCell>{formatPkr(row.remaining_amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{LAND_STATUS_LABELS[row.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No land records to report.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
