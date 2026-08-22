import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  FileText,
  History,
  Layers,
  MapPin,
  Maximize2,
  Plus,
  Receipt,
  User,
  Users,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  canManageCrm,
  canManageDocuments,
  canManageInventory,
  canViewPropertyCosts,
} from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  AREA_UNIT_LABELS,
  OWNERSHIP_SOURCE_LABELS,
  PAYMENT_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  SALE_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatNumber, formatPkr } from "@/lib/format";
import { ChangePropertyStatusForm } from "@/components/features/change-property-status-form";
import { LinkedDocumentsCard } from "@/components/features/linked-documents-card";
import { PropertyStatusBadge } from "@/components/features/property-status-badge";
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

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*, societies(id, name, code, location), society_blocks(id, name)")
    .eq("id", id)
    .maybeSingle();

  if (!property) {
    notFound();
  }

  const society = Array.isArray(property.societies)
    ? property.societies[0]
    : property.societies;
  const block = Array.isArray(property.society_blocks)
    ? property.society_blocks[0]
    : property.society_blocks;

  const [{ data: history }, costsResult, { data: documents }, { data: sales }] =
    await Promise.all([
      supabase
        .from("property_status_history")
        .select(
          "id, from_status, to_status, reason, changed_at, profiles!property_status_history_changed_by_fkey(full_name)",
        )
        .eq("property_id", id)
        .order("changed_at", { ascending: false }),
      canViewPropertyCosts(profile.role)
        ? supabase
            .from("property_costs")
            .select("acquisition_cost, min_approved_price")
            .eq("property_id", id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("documents")
        .select("id, code, title, document_type, status, document_date, version, mime_type")
        .eq("entity_type", "property")
        .eq("entity_id", id)
        .neq("status", "replaced")
        .order("document_date", { ascending: false }),
      supabase
        .from("sales")
        .select("*, customers(id, code, full_name, phone, id_number)")
        .eq("property_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const costs = costsResult.data;
  const currentSale = (sales ?? []).find((s) => s.status !== "cancelled");
  const currentCustomer = currentSale?.customers
    ? Array.isArray(currentSale.customers)
      ? currentSale.customers[0]
      : currentSale.customers
    : null;

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Inventory
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-xs font-semibold text-primary">{property.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Plot {property.plot_no}
            </h1>
            <PropertyStatusBadge status={property.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {society?.name ?? "Society"} {block?.name ? `· Block ${block.name}` : ""} · {PROPERTY_TYPE_LABELS[property.property_type]} · {formatNumber(property.area)} {AREA_UNIT_LABELS[property.area_unit]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageCrm(profile.role) &&
          (property.status === "available" || property.status === "hold") ? (
            <Button render={<Link href={`/bookings/new?property=${property.id}`} />}>
              <Plus className="size-4" />
              Book This Plot
            </Button>
          ) : currentSale ? (
            <Button render={<Link href={`/receipts/new?sale=${currentSale.id}`} />}>
              <Receipt className="size-4" />
              Receive Payment
            </Button>
          ) : null}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Asking Price"
          value={formatPkr(property.asking_price)}
          hint="Catalog valuation rate"
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title="Plot Dimensions"
          value={`${formatNumber(property.area)} ${AREA_UNIT_LABELS[property.area_unit]}`}
          hint={property.length_ft && property.width_ft ? `${property.length_ft} × ${property.width_ft} ft` : "Standard dimensions"}
          icon={Maximize2}
          variant="sky"
        />
        <StatCard
          title="Unit Status"
          value={PROPERTY_STATUS_LABELS[property.status]}
          hint={property.status === "hold" ? `Held for: ${property.hold_party_name || "Buyer"}` : property.status === "booked" ? "Allocated to buyer" : "Open for sale"}
          icon={property.status === "available" ? CheckCircle2 : Clock}
          variant={property.status === "available" ? "success" : property.status === "hold" ? "warning" : "indigo"}
        />
        <StatCard
          title="Buyer Status"
          value={currentCustomer ? currentCustomer.full_name : "No Active Buyer"}
          hint={currentCustomer ? `CNIC: ${currentCustomer.id_number || "On file"}` : "Unit is unassigned"}
          icon={User}
          variant={currentCustomer ? "primary" : "default"}
          href={currentCustomer ? `/customers/${currentCustomer.id}` : undefined}
        />
      </div>

      {/* Active Buyer & Allocation Card (If Booked/Sold) */}
      {currentSale && currentCustomer && (
        <div className="rounded-[10px] border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <h2 className="font-semibold text-base">Active Allottee &amp; Sale Contract</h2>
            </div>
            <Link
              href={`/customers/${currentCustomer.id}`}
              className="text-xs font-semibold text-primary hover:underline underline-offset-4"
            >
              View Full Customer Profile →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Detail label="Allottee Name">{currentCustomer.full_name}</Detail>
            <Detail label="Contact Phone">{currentCustomer.phone}</Detail>
            <Detail label="CNIC / ID">{currentCustomer.id_number || "—"}</Detail>
            <Detail label="Contract Code">{currentSale.code}</Detail>
            <Detail label="Agreed Sale Price">{formatPkr(currentSale.sale_amount)}</Detail>
            <Detail label="Down Payment / Token">{formatPkr(currentSale.token_amount)}</Detail>
            <Detail label="Remaining Balance">{formatPkr(currentSale.remaining_amount)}</Detail>
            <Detail label="Payment Plan">
              {PAYMENT_TYPE_LABELS[currentSale.payment_type]} ({currentSale.term_months} months)
            </Detail>
          </div>
        </div>
      )}

      {/* Main Grid: Details + Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Master Specification Card */}
          <div className="rounded-[10px] border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Building className="size-4 text-muted-foreground" />
                <h2 className="font-semibold text-base">Property Specifications</h2>
              </div>
              <span className="text-xs text-muted-foreground font-mono">PLOT #{property.plot_no}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Detail label="Society">
                <Link href="/societies" className="text-primary hover:underline underline-offset-4 font-semibold">
                  {society?.name ?? "—"}
                </Link>
              </Detail>
              <Detail label="Block / Sector">{block?.name ? `Block ${block.name}` : "General"}</Detail>
              <Detail label="Property Type">{PROPERTY_TYPE_LABELS[property.property_type]}</Detail>
              <Detail label="Ownership Source">{OWNERSHIP_SOURCE_LABELS[property.ownership_source]}</Detail>
              <Detail label="Total Area Size">
                {formatNumber(property.area)} {AREA_UNIT_LABELS[property.area_unit]}
              </Detail>
              <Detail label="Dimensions (L × W)">
                {property.length_ft && property.width_ft
                  ? `${formatNumber(property.length_ft)} ft × ${formatNumber(property.width_ft)} ft`
                  : "—"}
              </Detail>
              <Detail label="Front Facing">{property.facing || "Standard"}</Detail>
              <Detail label="Street Road Width">
                {property.street_width_ft ? `${formatNumber(property.street_width_ft)} ft wide road` : "—"}
              </Detail>
              <Detail label="Asking List Price">{formatPkr(property.asking_price)}</Detail>
              <Detail label="Estimated Monthly Rent">{formatPkr(property.monthly_rent)}</Detail>

              {canViewPropertyCosts(profile.role) ? (
                <>
                  <Detail label="Land Acquisition Cost">
                    {formatPkr(costs?.acquisition_cost)}
                  </Detail>
                  <Detail label="Minimum Floor Price">
                    {formatPkr(costs?.min_approved_price)}
                  </Detail>
                </>
              ) : null}

              <div className="sm:col-span-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Features &amp; Attributes</p>
                <div className="flex flex-wrap gap-1.5">
                  {property.attributes && property.attributes.length ? (
                    property.attributes.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="rounded-md font-normal">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No special tags</span>
                  )}
                </div>
              </div>

              {property.status === "hold" ? (
                <>
                  <Detail label="Held for Client">{property.hold_party_name || "—"}</Detail>
                  <Detail label="Hold Expiration Date">{formatDate(property.hold_until)}</Detail>
                </>
              ) : null}

              <div className="sm:col-span-2">
                <Detail label="Internal Society Notes">{property.internal_notes || "No internal remarks recorded."}</Detail>
              </div>
              <div className="sm:col-span-2">
                <Detail label="Broker / Public Remarks">{property.agent_notes || "No broker remarks."}</Detail>
              </div>
            </div>
          </div>

          {/* Booking History Table */}
          {(sales ?? []).length > 0 && (
            <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
              <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">Booking &amp; Sales Contracts History</h2>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale Code</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales?.map((sale: any) => {
                    const cust = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
                    return (
                      <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-primary">{sale.code}</TableCell>
                        <TableCell className="font-medium">
                          {cust ? (
                            <Link href={`/customers/${cust.id}`} className="hover:underline text-primary">
                              {cust.full_name}
                            </Link>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="font-semibold">{formatPkr(sale.sale_amount)}</TableCell>
                        <TableCell className="font-semibold text-amber-600 dark:text-amber-400">{formatPkr(sale.remaining_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-md">
                            {SALE_STATUS_LABELS[sale.status as keyof typeof SALE_STATUS_LABELS] ?? sale.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Sidebar Column: Status Management & History */}
        <div className="space-y-6">
          {canManageInventory(profile.role) ? (
            <div className="rounded-[10px] border bg-card p-5 shadow-xs">
              <h2 className="font-semibold text-sm border-b pb-2.5 mb-4">Update Unit Status</h2>
              <ChangePropertyStatusForm
                propertyId={property.id}
                currentStatus={property.status}
              />
            </div>
          ) : null}

          {/* Status Timeline History */}
          <div className="rounded-[10px] border bg-card p-5 shadow-xs">
            <h2 className="font-semibold text-sm border-b pb-2.5 mb-4">Status Movement History</h2>
            <div className="space-y-3.5">
              {history?.length ? (
                history.map((entry: any) => {
                  const actor = Array.isArray(entry.profiles)
                    ? entry.profiles[0]
                    : entry.profiles;

                  return (
                    <div key={entry.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        {entry.from_status ? (
                          <>
                            <span className="text-muted-foreground">{PROPERTY_STATUS_LABELS[entry.from_status as keyof typeof PROPERTY_STATUS_LABELS] ?? entry.from_status}</span>
                            <span className="text-muted-foreground">→</span>
                          </>
                        ) : null}
                        <span className="text-primary">{PROPERTY_STATUS_LABELS[entry.to_status as keyof typeof PROPERTY_STATUS_LABELS] ?? entry.to_status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(entry.changed_at)}
                        {actor?.full_name ? ` · ${actor.full_name}` : ""}
                      </p>
                      {entry.reason ? (
                        <p className="mt-1 text-xs bg-muted/40 p-2 rounded-md italic">{entry.reason}</p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">No historical status changes recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Linked Documents Card */}
      <LinkedDocumentsCard
        entityType="property"
        entityId={property.id}
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
