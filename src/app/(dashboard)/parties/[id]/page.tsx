import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle,
  CreditCard,
  FileSpreadsheet,
  Handshake,
  LandPlot,
  MapPin,
  Plus,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts, canManageDocuments, canManageParties } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  AREA_UNIT_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  LAND_STATUS_LABELS,
  PARTY_STATUS_LABELS,
  PARTY_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
} from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { roundMoney } from "@/lib/installments";
import { LinkedDocumentsCard } from "@/components/features/linked-documents-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PartyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: party } = await supabase
    .from("parties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!party) {
    notFound();
  }

  const [
    { data: contracts },
    { data: payments },
    bankResult,
    { data: documents },
    { data: landParcels },
    { data: devExpenses },
  ] = await Promise.all([
    supabase
      .from("contracts")
      .select(
        "id, code, title, contract_type, contract_value, paid_amount, remaining_amount, status, society_id, societies(name)",
      )
      .eq("party_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("contract_payments")
      .select("id, code, payment_date, amount, payment_mode, contract_id, contracts(code, title)")
      .eq("party_id", id)
      .order("payment_date", { ascending: false }),
    canManageAccounts(profile.role)
      ? supabase
          .from("party_bank_details")
          .select("bank_name, account_title, account_no, iban")
          .eq("party_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("documents")
      .select("id, code, title, document_type, status, document_date, version, mime_type")
      .eq("entity_type", "party")
      .eq("entity_id", id)
      .neq("status", "replaced")
      .order("document_date", { ascending: false }),
    supabase
      .from("land_parcels")
      .select("id, code, title, area, area_unit, purchase_value, remaining_amount, status, societies(name)")
      .eq("party_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("development_expenses")
      .select("id, expense_date, amount, description, development_projects(name, category)")
      .eq("party_id", id)
      .order("expense_date", { ascending: false })
      .limit(50),
  ]);

  const bank = bankResult.data;
  const activeContracts = (contracts ?? []).filter((row) => row.status !== "cancelled");
  const contractValue = activeContracts.reduce((sum, row) => sum + Number(row.contract_value), 0);
  const paidContracts = activeContracts.reduce((sum, row) => sum + Number(row.paid_amount), 0);

  const landList = landParcels ?? [];
  const totalLandValue = landList.reduce((sum, row) => sum + Number(row.purchase_value || 0), 0);
  const totalLandRemaining = landList.reduce((sum, row) => sum + Number(row.remaining_amount || 0), 0);

  const remaining = roundMoney(
    Number(party.opening_balance) +
      activeContracts.reduce((sum, row) => sum + Number(row.remaining_amount), 0) +
      totalLandRemaining,
  );

  const openContract = activeContracts.find((row) => Number(row.remaining_amount) > 0);

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/parties"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Parties
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-xs font-semibold text-primary">{party.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {party.name}
            </h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {PARTY_TYPE_LABELS[party.party_type]}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {PARTY_STATUS_LABELS[party.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Phone: {party.phone} {party.phone_secondary ? `· Alt: ${party.phone_secondary}` : ""} · CNIC/NTN: {party.id_number || "Not provided"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageParties(profile.role) ? (
            <Button
              render={<Link href={`/parties/${party.id}/contracts/new`} />}
              variant="outline"
            >
              <Plus className="size-4" />
              New Work Order
            </Button>
          ) : null}
          {canManageAccounts(profile.role) && openContract ? (
            <Button
              render={
                <Link
                  href={`/parties/${party.id}/pay?contract=${openContract.id}`}
                />
              }
            >
              <CreditCard className="size-4" />
              Pay Contract
            </Button>
          ) : null}
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Work Orders Value"
          value={formatPkr(contractValue)}
          hint={`${activeContracts.length} active civil contracts`}
          icon={Briefcase}
          variant="primary"
        />
        <StatCard
          title="Total Paid by Society"
          value={formatPkr(paidContracts)}
          hint={`${(payments ?? []).length} payment vouchers issued`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Net Outstanding Payable"
          value={formatPkr(remaining)}
          hint={`Opening balance: ${formatPkr(party.opening_balance)}`}
          icon={Wallet}
          variant={remaining > 0 ? "warning" : "default"}
          href="/cash-book"
        />
        <StatCard
          title="Land Acquisitions"
          value={landList.length > 0 ? formatPkr(totalLandValue) : "No Land Deals"}
          hint={landList.length > 0 ? `${landList.length} parcels recorded` : "Contractor / Vendor profile"}
          icon={LandPlot}
          variant="sky"
          href="/land-bank"
        />
      </div>

      {/* Party Master Profile Card */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3 mb-5">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">Party Details &amp; Banking Info</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">CODE: {party.code}</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Detail label="Full Name / Company">{party.name}</Detail>
          <Detail label="Category Type">{PARTY_TYPE_LABELS[party.party_type]}</Detail>
          <Detail label="Primary Phone">{party.phone}</Detail>
          <Detail label="Secondary Contact">{party.phone_secondary || "—"}</Detail>
          <Detail label="CNIC / NTN Number">{party.id_number || "Not provided"}</Detail>
          <Detail label="Opening Balance">{formatPkr(party.opening_balance)}</Detail>
          <Detail label="Account Status">{PARTY_STATUS_LABELS[party.status]}</Detail>
          <Detail label="Registered Date">{formatDate(party.created_at)}</Detail>
          <div className="sm:col-span-2">
            <Detail label="Postal Address / Workshop">{party.address || "—"}</Detail>
          </div>
          <div className="sm:col-span-2">
            <Detail label="Terms &amp; Ledger Notes">{party.notes || "No special notes recorded."}</Detail>
          </div>

          {canManageAccounts(profile.role) && bank && (
            <>
              <div className="sm:col-span-4 border-t pt-4 mt-2">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  Verified Bank Settlement Account
                </h3>
              </div>
              <Detail label="Bank Name">{bank.bank_name || "—"}</Detail>
              <Detail label="Account Title">{bank.account_title || "—"}</Detail>
              <Detail label="Account Number">{bank.account_no || "—"}</Detail>
              <Detail label="IBAN Number">{bank.iban || "—"}</Detail>
            </>
          )}
        </div>
      </div>

      {/* Section 1: Work Orders & Contracts */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Work Orders &amp; Construction Contracts</h2>
          </div>
          <span className="text-xs text-muted-foreground">{activeContracts.length} work orders</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>WO Number</TableHead>
              <TableHead>Title &amp; Society</TableHead>
              <TableHead>Contract Type</TableHead>
              <TableHead>Agreed Value</TableHead>
              <TableHead>Paid Amount</TableHead>
              <TableHead>Remaining Due</TableHead>
              <TableHead>Status</TableHead>
              {canManageAccounts(profile.role) && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts?.length ? (
              contracts.map((row) => {
                const society = Array.isArray(row.societies)
                  ? row.societies[0]
                  : row.societies;

                return (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      <Link
                        href={`/parties/${party.id}/contracts/${row.id}`}
                        className="hover:underline underline-offset-4"
                      >
                        {row.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/parties/${party.id}/contracts/${row.id}`}
                        className="font-medium text-foreground hover:underline underline-offset-4"
                      >
                        {row.title}
                      </Link>
                      {society?.name ? (
                        <span className="text-xs text-muted-foreground">
                          {society.name}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {CONTRACT_TYPE_LABELS[row.contract_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatPkr(row.contract_value)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">{formatPkr(row.paid_amount)}</TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">{formatPkr(row.remaining_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md">
                        {CONTRACT_STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                    {canManageAccounts(profile.role) && (
                      <TableCell className="text-right">
                        {Number(row.remaining_amount) > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-md"
                            render={<Link href={`/parties/${party.id}/pay?contract=${row.id}`} />}
                          >
                            Pay
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Settled</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canManageAccounts(profile.role) ? 8 : 7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No work orders logged for this contractor.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Section 2: Land Bank Parcels (if landlord) */}
      {landList.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <LandPlot className="size-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Land Bank Parcels Acquired</h2>
            </div>
            <span className="text-xs text-muted-foreground">{landList.length} parcels</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land Code</TableHead>
                <TableHead>Parcel Title</TableHead>
                <TableHead>Society</TableHead>
                <TableHead>Area Size</TableHead>
                <TableHead>Agreed Value</TableHead>
                <TableHead>Remaining Payable</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {landList.map((parcel: any) => {
                const society = Array.isArray(parcel.societies) ? parcel.societies[0] : parcel.societies;
                return (
                  <TableRow key={parcel.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      <Link href={`/land-bank/${parcel.id}`} className="hover:underline underline-offset-4">
                        {parcel.code}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{parcel.title}</TableCell>
                    <TableCell>{society?.name ?? "—"}</TableCell>
                    <TableCell className="font-medium">{parcel.area} {AREA_UNIT_LABELS[parcel.area_unit as keyof typeof AREA_UNIT_LABELS] ?? parcel.area_unit}</TableCell>
                    <TableCell className="font-semibold">{formatPkr(parcel.purchase_value)}</TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">{formatPkr(parcel.remaining_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md">
                        {LAND_STATUS_LABELS[parcel.status as keyof typeof LAND_STATUS_LABELS] ?? parcel.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Section 3: Payments Issued Log */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Disbursed Payment Vouchers</h2>
          </div>
          <span className="text-xs text-muted-foreground">{(payments ?? []).length} payment vouchers</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Work Order</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead className="text-right">Disbursed Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.length ? (
              payments.map((row: any) => {
                const contract = Array.isArray(row.contracts)
                  ? row.contracts[0]
                  : row.contracts;

                return (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{row.code}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(row.payment_date)}</TableCell>
                    <TableCell>
                      {contract?.code ? `${contract.code} · ${contract.title}` : "General Settlement"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {PAYMENT_MODE_LABELS[row.payment_mode as keyof typeof PAYMENT_MODE_LABELS] ?? row.payment_mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">
                      {formatPkr(row.amount)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No payment vouchers issued to this party yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Section 4: Development Expenses */}
      {(devExpenses ?? []).length > 0 && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Development Expense Vouchers</h2>
            </div>
            <span className="text-xs text-muted-foreground">{(devExpenses ?? []).length} expense records</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Expense Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devExpenses?.map((exp: any) => {
                const proj = Array.isArray(exp.development_projects) ? exp.development_projects[0] : exp.development_projects;
                return (
                  <TableRow key={exp.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(exp.expense_date)}</TableCell>
                    <TableCell className="font-medium">{proj?.name ?? "—"}</TableCell>
                    <TableCell>{exp.description}</TableCell>
                    <TableCell className="text-right font-semibold text-amber-600 dark:text-amber-400">{formatPkr(exp.amount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Section 5: Documents */}
      <LinkedDocumentsCard
        entityType="party"
        entityId={party.id}
        documents={documents ?? []}
        canUpload={canManageDocuments(profile.role)}
      />
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}
