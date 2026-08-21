import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle,
  CreditCard,
  FileText,
  Handshake,
  LandPlot,
  MapPin,
  Phone,
  Plus,
  Printer,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { canManageCrm, canManageDocuments, deriveInstallmentStatus } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  AREA_UNIT_LABELS,
  CUSTOMER_RELATION_LABELS,
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STAGE_LABELS,
  ID_TYPE_LABELS,
  INSTALLMENT_STATUS_LABELS,
  PAYMENT_MODE_LABELS,
  PAYMENT_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  SALE_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, formatNumber, formatPkr } from "@/lib/format";
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

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!customer) {
    notFound();
  }

  // Fetch sales, receipts, documents, and related parties (if customer also acts as land seller)
  const [{ data: sales }, { data: receipts }, { data: documents }] =
    await Promise.all([
      supabase
        .from("sales")
        .select(
          `
          *,
          societies (id, name, location),
          properties (id, code, plot_no, block_id, society_blocks (name)),
          agent_commissions (id, commission_amount, status, agents (id, name, phone))
        `,
        )
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("receipts")
        .select("id, code, payment_date, amount, payment_mode, sale_id, sales (plot_no, code)")
        .eq("customer_id", id)
        .order("payment_date", { ascending: false }),
      supabase
        .from("documents")
        .select("id, code, title, document_type, status, document_date, version")
        .eq("entity_type", "customer")
        .eq("entity_id", id)
        .neq("status", "replaced")
        .order("document_date", { ascending: false }),
    ]);

  const saleList = sales ?? [];
  const saleIds = saleList.map((s) => s.id);

  const { data: installments } = saleIds.length
    ? await supabase
        .from("installments")
        .select(
          "id, sale_id, installment_no, period_label, due_date, scheduled_amount, received_amount, sales (plot_no, code, society_id, societies (name))",
        )
        .in("sale_id", saleIds)
        .order("due_date")
    : { data: [] };

  // Calculate totals
  const totalPurchasesValue = saleList.reduce((sum, s) => sum + Number(s.sale_amount || 0), 0);
  const totalPaid = (receipts ?? []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalRemainingBalance = saleList
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + Number(s.remaining_amount || 0), 0);

  const installmentList = (installments ?? []).map((row) => {
    const status = deriveInstallmentStatus(
      row.due_date,
      Number(row.scheduled_amount),
      Number(row.received_amount),
    );
    const sale = Array.isArray(row.sales) ? row.sales[0] : row.sales;
    const society = Array.isArray(sale?.societies) ? sale?.societies[0] : sale?.societies;
    return { ...row, status, sale, society };
  });

  const overdueCount = installmentList.filter((i) => i.status === "overdue").length;
  const overdueAmount = installmentList
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + (Number(i.scheduled_amount) - Number(i.received_amount)), 0);

  const nextDue = installmentList.find(
    (i) => i.status === "due" || i.status === "upcoming" || i.status === "overdue",
  );

  const openSale = saleList.find(
    (sale) => sale.status !== "cancelled" && Number(sale.remaining_amount) > 0,
  );

  const canEdit = canManageCrm(profile.role);

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/customers"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Customers
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-xs font-semibold text-primary">{customer.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {customer.full_name}
            </h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {CUSTOMER_STAGE_LABELS[customer.stage]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {CUSTOMER_RELATION_LABELS[customer.relation]}: {customer.guardian_name || "—"} · Phone: {customer.phone} {customer.phone_secondary ? `· Alt: ${customer.phone_secondary}` : ""} · CNIC: {customer.id_number || "Not on file"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              {openSale ? (
                <Button render={<Link href={`/receipts/new?sale=${openSale.id}`} />}>
                  <Receipt className="size-4" />
                  Receive Payment
                </Button>
              ) : (
                <Button render={<Link href="/receipts/new" />} variant="outline">
                  <Receipt className="size-4" />
                  Receive Payment
                </Button>
              )}
              <Button
                render={<Link href={`/bookings/new?customer=${customer.id}`} />}
                variant={openSale ? "outline" : "default"}
              >
                <Plus className="size-4" />
                Book New Plot
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI 360-degree Financial Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Plot Bookings"
          value={formatPkr(totalPurchasesValue)}
          hint={`${saleList.length} total property units booked`}
          icon={Building2}
          variant="primary"
        />
        <StatCard
          title="Total Paid to Date"
          value={formatPkr(totalPaid)}
          hint={`${(receipts ?? []).length} payment vouchers cleared`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Remaining Balance"
          value={formatPkr(totalRemainingBalance)}
          hint="Total payable on active contracts"
          icon={Wallet}
          variant={totalRemainingBalance > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Overdue / Milestone Dues"
          value={overdueCount > 0 ? formatPkr(overdueAmount) : nextDue ? formatDate(nextDue.due_date) : "All Cleared"}
          hint={overdueCount > 0 ? `${overdueCount} overdue installments` : nextDue ? `Next: ${formatPkr(nextDue.scheduled_amount)}` : "No pending dues"}
          icon={CalendarClock}
          variant={overdueCount > 0 ? "danger" : "sky"}
        />
      </div>

      {/* Customer Master Profile Card */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3 mb-5">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">Customer Master Profile</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">ID: {customer.code}</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Detail label="Full Name">{customer.full_name}</Detail>
          <Detail label="Relation & Guardian">
            {CUSTOMER_RELATION_LABELS[customer.relation]}: {customer.guardian_name || "—"}
          </Detail>
          <Detail label="Primary Phone">{customer.phone}</Detail>
          <Detail label="Secondary Contact">{customer.phone_secondary || "—"}</Detail>
          <Detail label="Identity Document">
            {ID_TYPE_LABELS[customer.id_type]}: {customer.id_number || "Not provided"}
          </Detail>
          <Detail label="Lead Source">{CUSTOMER_SOURCE_LABELS[customer.source]}</Detail>
          <Detail label="Caste / Sub-caste">{customer.caste || "—"}</Detail>
          <Detail label="Registered On">{formatDate(customer.created_at)}</Detail>
          <div className="sm:col-span-2">
            <Detail label="Permanent / Postal Address">{customer.address || "—"}</Detail>
          </div>
          <div className="sm:col-span-2">
            <Detail label="Internal Agent / CRM Notes">{customer.notes || "No special notes recorded."}</Detail>
          </div>
        </div>
      </div>

      {/* Section 1: Bookings & Plot Purchases */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Plot Bookings &amp; Sales Deals</h2>
          </div>
          <span className="text-xs text-muted-foreground">{saleList.length} deals</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking Code</TableHead>
              <TableHead>Society &amp; Block</TableHead>
              <TableHead>Plot / Unit No</TableHead>
              <TableHead>Property Type</TableHead>
              <TableHead>Area Size</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Balance Due</TableHead>
              <TableHead>Deal Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {saleList.length ? (
              saleList.map((sale: any) => {
                const society = Array.isArray(sale.societies) ? sale.societies[0] : sale.societies;
                const property = Array.isArray(sale.properties) ? sale.properties[0] : sale.properties;
                const block = Array.isArray(property?.society_blocks)
                  ? property.society_blocks[0]
                  : property?.society_blocks;

                return (
                  <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {sale.code}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{society?.name ?? "—"}</span>
                      {block?.name && (
                        <span className="text-xs text-muted-foreground ml-1">· Block {block.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {sale.plot_no}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {PROPERTY_TYPE_LABELS[sale.property_type as keyof typeof PROPERTY_TYPE_LABELS] ?? sale.property_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(sale.area)} {AREA_UNIT_LABELS[sale.area_unit as keyof typeof AREA_UNIT_LABELS] ?? sale.area_unit}
                    </TableCell>
                    <TableCell className="font-semibold">{formatPkr(sale.sale_amount)}</TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatPkr(sale.remaining_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md">
                        {SALE_STATUS_LABELS[sale.status as keyof typeof SALE_STATUS_LABELS] ?? sale.status} ·{" "}
                        {PAYMENT_TYPE_LABELS[sale.payment_type as keyof typeof PAYMENT_TYPE_LABELS] ?? sale.payment_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(sale.remaining_amount) > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs rounded-md"
                          render={<Link href={`/receipts/new?sale=${sale.id}`} />}
                        >
                          Receive
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Paid in Full
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  No property bookings registered for this customer yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Section 2: Installment Milestones & Schedule */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Installment Milestones &amp; EMI Plan</h2>
          </div>
          <span className="text-xs text-muted-foreground">{installmentList.length} scheduled installments</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Milestone #</TableHead>
              <TableHead>Plot / Booking</TableHead>
              <TableHead>Period Description</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Scheduled Amount</TableHead>
              <TableHead>Received to Date</TableHead>
              <TableHead>Status</TableHead>
              {canEdit ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {installmentList.length ? (
              installmentList.map((row: any) => {
                const openAmount = roundMoney(
                  Number(row.scheduled_amount) - Number(row.received_amount),
                );

                return (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold">
                      #{row.installment_no}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.sale?.plot_no ?? "—"}</div>
                      <div className="font-mono text-xs text-muted-foreground">{row.sale?.code}</div>
                    </TableCell>
                    <TableCell>{row.period_label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(row.due_date)}</TableCell>
                    <TableCell className="font-semibold">{formatPkr(row.scheduled_amount)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(row.received_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.status === "overdue" ? "destructive" : "secondary"}
                        className="rounded-md font-normal"
                      >
                        {INSTALLMENT_STATUS_LABELS[row.status as keyof typeof INSTALLMENT_STATUS_LABELS] ?? row.status}
                      </Badge>
                    </TableCell>
                    {canEdit ? (
                      <TableCell className="text-right">
                        {openAmount > 0 && row.sale_id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-md"
                            render={
                              <Link
                                href={`/receipts/new?sale=${row.sale_id}&installment=${row.id}`}
                              />
                            }
                          >
                            Receive
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Cleared</span>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 8 : 7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No installment schedules for this customer.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Section 3: Receipts & Payment History */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Customer Payment Receipts &amp; Vouchers</h2>
          </div>
          <span className="text-xs text-muted-foreground">{(receipts ?? []).length} receipts</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Linked Plot / Sale</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Print Voucher</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(receipts ?? []).length ? (
              (receipts ?? []).map((receipt: any) => {
                const sale = Array.isArray(receipt.sales) ? receipt.sales[0] : receipt.sales;
                return (
                  <TableRow key={receipt.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      <Link
                        href={`/receipts/${receipt.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {receipt.code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(receipt.payment_date)}</TableCell>
                    <TableCell>
                      {sale?.plot_no ? (
                        <div>
                          <span className="font-medium">{sale.plot_no}</span>
                          <span className="ml-1 text-xs text-muted-foreground font-mono">({sale.code})</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {PAYMENT_MODE_LABELS[receipt.payment_mode as keyof typeof PAYMENT_MODE_LABELS] ?? receipt.payment_mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(receipt.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-md"
                        render={<Link href={`/receipts/${receipt.id}`} />}
                      >
                        <Printer className="size-3 mr-1" />
                        Print
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No payment receipts issued yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Section 4: Broker Commissions on Customer Sales */}
      {saleList.some((s: any) => s.agent_commissions?.length > 0) && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Handshake className="size-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Agent &amp; Broker Commission Records</h2>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent / Broker</TableHead>
                <TableHead>Booking Deal</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Commission Amount</TableHead>
                <TableHead>Payout Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saleList.flatMap((s: any) =>
                (s.agent_commissions || []).map((c: any) => {
                  const agent = Array.isArray(c.agents) ? c.agents[0] : c.agents;
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold">
                        {agent ? (
                          <Link href={`/agents/${agent.id}`} className="text-primary hover:underline underline-offset-4">
                            {agent.name}
                          </Link>
                        ) : (
                          "Broker"
                        )}
                      </TableCell>
                      <TableCell>
                        {s.plot_no} ({s.code})
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{agent?.phone ?? "—"}</TableCell>
                      <TableCell className="font-semibold">{formatPkr(c.commission_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-md">
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                }),
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Section 5: Customer Legal Documents & Uploads */}
      <LinkedDocumentsCard
        entityType="customer"
        entityId={customer.id}
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
