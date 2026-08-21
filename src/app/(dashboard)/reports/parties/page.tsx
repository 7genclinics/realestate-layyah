import Link from "next/link";
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

  if (!canViewFinancialReports(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Contractor ledger</h1>
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
        title="Contractor / vendor ledger"
        description="Contract value, payments and balance payable, including opening balances."
        filename="party-ledger"
        headers={["Party ID", "Name", "Type", "Contract value", "Paid", "Payable"]}
        rows={rows.map((row) => [
          row.code,
          row.name,
          PARTY_TYPE_LABELS[row.party_type],
          row.value,
          row.paid,
          row.remaining,
        ])}
      />
      <ReportTotals
        items={[
          {
            label: "Contract value",
            value: formatPkr(rows.reduce((sum, row) => sum + row.value, 0)),
          },
          {
            label: "Paid",
            value: formatPkr(rows.reduce((sum, row) => sum + row.paid, 0)),
          },
          {
            label: "Payable",
            value: formatPkr(rows.reduce((sum, row) => sum + row.remaining, 0)),
          },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Party</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contract value</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Payable</TableHead>
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
                  <TableCell>{PARTY_TYPE_LABELS[row.party_type]}</TableCell>
                  <TableCell>{formatPkr(row.value)}</TableCell>
                  <TableCell>{formatPkr(row.paid)}</TableCell>
                  <TableCell>{formatPkr(row.remaining)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No parties to report.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
