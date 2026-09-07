import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  CreditCard,
  FileSpreadsheet,
  FileText,
  LandPlot,
  Layers,
  MapPin,
  Plus,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import {
  canApproveLand,
  canManageAccounts,
  canManageDocuments,
  canManageInventory,
  canManageLandBank,
} from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  AREA_UNIT_LABELS,
  LAND_ACQUISITION_LABELS,
  LAND_STATUS_LABELS,
  PAYMENT_MODE_LABELS,
} from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { LandActionButton } from "@/components/features/land-action-button";
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

export default async function LandParcelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("pages.landBank");
  const tStatus = await getTranslations("labels.landStatus");
  const tAcq = await getTranslations("labels.landAcquisition");
  const tUnit = await getTranslations("labels.areaUnit");
  const tPay = await getTranslations("labels.paymentMode");
  const tCommon = await getTranslations("common");

  const { data: parcel } = await supabase
    .from("land_parcels")
    .select(
      "*, parties(id, name, code, phone, id_number), societies(id, name, code, location), properties(id, code, plot_no)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!parcel) {
    notFound();
  }

  const party = Array.isArray(parcel.parties) ? parcel.parties[0] : parcel.parties;
  const society = Array.isArray(parcel.societies)
    ? parcel.societies[0]
    : parcel.societies;
  const property = Array.isArray(parcel.properties)
    ? parcel.properties[0]
    : parcel.properties;

  const [{ data: payments }, { data: documents }] = await Promise.all([
    supabase
      .from("land_payments")
      .select("id, code, payment_date, amount, payment_mode, reference_no")
      .eq("land_parcel_id", id)
      .order("payment_date", { ascending: false }),
    supabase
      .from("documents")
      .select("id, code, title, document_type, status, document_date, version, mime_type")
      .eq("entity_type", "land_parcel")
      .eq("entity_id", id)
      .neq("status", "replaced")
      .order("document_date", { ascending: false }),
  ]);

  const canPay =
    canManageAccounts(profile.role) &&
    Number(parcel.remaining_amount) > 0 &&
    (parcel.status === "approved" ||
      parcel.status === "partially_paid" ||
      parcel.status === "fully_paid");
  const canApprove =
    canApproveLand(profile.role) &&
    (parcel.status === "proposed" || parcel.status === "under_negotiation");
  const canAddInventory =
    canManageInventory(profile.role) &&
    !parcel.property_id &&
    parcel.status !== "proposed" &&
    parcel.status !== "under_negotiation";

  return (
    <div className="space-y-8">
      {/* Header & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/land-bank"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {t("backToLandBank")}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-xs font-semibold text-primary">{parcel.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{parcel.title}</h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {tAcq(parcel.acquisition_type)}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {tStatus(parcel.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {tCommon("society")}: {society?.name ?? tCommon("dash")} · {parcel.location || tCommon("dash")} · {parcel.area} {tUnit(parcel.area_unit)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canApprove ? (
            <LandActionButton action="approve-parcel" id={parcel.id} label={t("approveParcel")} />
          ) : null}
          {canPay ? (
            <Button render={<Link href={`/land-bank/${parcel.id}/pay`} />}>
              <CreditCard className="size-4" />
              {t("payLand")}
            </Button>
          ) : null}
          {canAddInventory ? (
            <LandActionButton
              action="add-inventory"
              id={parcel.id}
              label={t("convertInventory")}
              variant="outline"
            />
          ) : null}
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("acquisitionValue")}
          value={formatPkr(parcel.purchase_value, locale)}
          hint={`${parcel.area} ${tUnit(parcel.area_unit)}`}
          icon={LandPlot}
          variant="primary"
        />
        <StatCard
          title={t("payTitle")}
          value={formatPkr(parcel.paid_amount, locale)}
          hint={`${(payments ?? []).length}`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title={t("remainingPayable")}
          value={formatPkr(parcel.remaining_amount, locale)}
          hint={parcel.token_amount ? formatPkr(parcel.token_amount, locale) : t("payableHint")}
          icon={Wallet}
          variant={Number(parcel.remaining_amount) > 0 ? "warning" : "default"}
          href="/cash-book"
        />
        <StatCard
          title={t("area")}
          value={parcel.rate_per_unit ? formatPkr(parcel.rate_per_unit, locale) : tCommon("dash")}
          hint={tUnit(parcel.area_unit)}
          icon={FileSpreadsheet}
          variant="sky"
        />
      </div>

      {/* Land Parcel Revenue Record Card */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3 mb-5">
          <div className="flex items-center gap-2">
            <LandPlot className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">Revenue Record &amp; Landlord Profile</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">PARCEL #{parcel.code}</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Detail label="Parcel Title">{parcel.title}</Detail>
          <Detail label="Landlord / Seller">
            {party ? (
              <Link
                href={`/parties/${party.id}`}
                className="text-primary hover:underline underline-offset-4 font-semibold"
              >
                {party.name} · {party.phone}
              </Link>
            ) : (
              "—"
            )}
          </Detail>
          <Detail label="Target Society">
            {society ? (
              <Link href="/societies" className="text-primary hover:underline underline-offset-4 font-semibold">
                {society.name}
              </Link>
            ) : (
              "—"
            )}
          </Detail>
          <Detail label="Total Area">
            {parcel.area} {AREA_UNIT_LABELS[parcel.area_unit as keyof typeof AREA_UNIT_LABELS] ?? parcel.area_unit}
          </Detail>
          <Detail label="Khasra Number">{parcel.khasra || "—"}</Detail>
          <Detail label="Khewat Number">{parcel.khewat || "—"}</Detail>
          <Detail label="Khata Number">{parcel.khata || "—"}</Detail>
          <Detail label="Mouza / Village">{parcel.mouza || "—"}</Detail>
          <Detail label="Location / Mauza Address">{parcel.location || "—"}</Detail>
          <Detail label="Linked Inventory Plot">
            {property ? (
              <Link
                href={`/inventory/${property.id}`}
                className="text-primary hover:underline underline-offset-4 font-semibold"
              >
                {property.code} · Plot #{property.plot_no}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">Unallocated to inventory</span>
            )}
          </Detail>
          <div className="sm:col-span-2">
            <Detail label="Acquisition Terms &amp; Conditions">{parcel.agreement_terms || "Standard sale agreement terms."}</Detail>
          </div>
        </div>
      </div>

      {/* Disbursed Payments Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Disbursed Land Payment Vouchers</h2>
          </div>
          <span className="text-xs text-muted-foreground">{(payments ?? []).length} payment vouchers</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher No</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Cheque / Ref No</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(payments ?? []).length ? (
              (payments ?? []).map((row: any) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{row.code}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(row.payment_date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-md font-normal">
                      {PAYMENT_MODE_LABELS[row.payment_mode as keyof typeof PAYMENT_MODE_LABELS] ?? row.payment_mode}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.reference_no || "—"}</TableCell>
                  <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">
                    {formatPkr(row.amount)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No payment vouchers posted to landlord yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Linked Legal Documents & Fard */}
      <LinkedDocumentsCard
        entityType="land_parcel"
        entityId={parcel.id}
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
