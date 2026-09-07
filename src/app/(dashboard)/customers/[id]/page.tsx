import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle,
  Handshake,
  Plus,
  Printer,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
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
  const locale = await getLocale();
  const t = await getTranslations("customers");
  const tCommon = await getTranslations("common");
  const tStage = await getTranslations("labels.customerStage");
  const tRelation = await getTranslations("labels.customerRelation");
  const tIdType = await getTranslations("labels.idType");
  const tSource = await getTranslations("labels.customerSource");
  const tPropType = await getTranslations("labels.propertyType");
  const tUnit = await getTranslations("labels.areaUnit");
  const tSale = await getTranslations("labels.saleStatus");
  const tPayType = await getTranslations("labels.paymentType");
  const tInst = await getTranslations("labels.installmentStatus");
  const tPayMode = await getTranslations("labels.paymentMode");
  const tCommission = await getTranslations("labels.commissionStatus");

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!customer) {
    notFound();
  }

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
        .select("id, code, title, document_type, status, document_date, version, mime_type")
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/customers"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {t("backToCustomers")}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-xs font-semibold text-primary">{customer.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {customer.full_name}
            </h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {tStage(customer.stage as keyof typeof CUSTOMER_STAGE_LABELS)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {tRelation(customer.relation as keyof typeof CUSTOMER_RELATION_LABELS)}: {customer.guardian_name || tCommon("dash")} · {t("phoneLine", { phone: customer.phone })} {customer.phone_secondary ? `· ${t("altPhone", { phone: customer.phone_secondary })}` : ""} · {t("cnicLine", { id: customer.id_number || t("notOnFile") })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              {openSale ? (
                <Button render={<Link href={`/receipts/new?sale=${openSale.id}`} />}>
                  <Receipt className="size-4" />
                  {t("receivePayment")}
                </Button>
              ) : (
                <Button render={<Link href="/receipts/new" />} variant="outline">
                  <Receipt className="size-4" />
                  {t("receivePayment")}
                </Button>
              )}
              <Button
                render={<Link href={`/bookings/new?customer=${customer.id}`} />}
                variant={openSale ? "outline" : "default"}
              >
                <Plus className="size-4" />
                {t("bookNewPlot")}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("totalPlotBookings")}
          value={formatPkr(totalPurchasesValue, locale)}
          hint={t("unitsBooked", { count: saleList.length })}
          icon={Building2}
          variant="primary"
        />
        <StatCard
          title={t("totalPaidToDate")}
          value={formatPkr(totalPaid, locale)}
          hint={t("vouchersCleared", { count: (receipts ?? []).length })}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title={t("remainingBalance")}
          value={formatPkr(totalRemainingBalance, locale)}
          hint={t("payableActive")}
          icon={Wallet}
          variant={totalRemainingBalance > 0 ? "warning" : "default"}
        />
        <StatCard
          title={t("overdueMilestone")}
          value={overdueCount > 0 ? formatPkr(overdueAmount, locale) : nextDue ? formatDate(nextDue.due_date, locale) : t("allCleared")}
          hint={overdueCount > 0 ? t("overdueInstallments", { count: overdueCount }) : nextDue ? t("nextAmount", { amount: formatPkr(nextDue.scheduled_amount, locale) }) : t("noPendingDues")}
          icon={CalendarClock}
          variant={overdueCount > 0 ? "danger" : "sky"}
        />
      </div>

      <div className="rounded-[10px] border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3 mb-5">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">{t("masterProfile")}</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{t("idLabel", { code: customer.code })}</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Detail label={t("fullName")}>{customer.full_name}</Detail>
          <Detail label={t("relationGuardian")}>
            {tRelation(customer.relation as keyof typeof CUSTOMER_RELATION_LABELS)}: {customer.guardian_name || tCommon("dash")}
          </Detail>
          <Detail label={t("primaryPhone")}>{customer.phone}</Detail>
          <Detail label={t("secondaryContact")}>{customer.phone_secondary || tCommon("dash")}</Detail>
          <Detail label={t("identityDocument")}>
            {t("idValue", {
              type: tIdType(customer.id_type as keyof typeof ID_TYPE_LABELS),
              number: customer.id_number || t("notProvided"),
            })}
          </Detail>
          <Detail label={t("leadSource")}>{tSource(customer.source as keyof typeof CUSTOMER_SOURCE_LABELS)}</Detail>
          <Detail label={t("caste")}>{customer.caste || tCommon("dash")}</Detail>
          <Detail label={t("registeredOn")}>{formatDate(customer.created_at, locale)}</Detail>
          <div className="sm:col-span-2">
            <Detail label={t("postalAddress")}>{customer.address || tCommon("dash")}</Detail>
          </div>
          <div className="sm:col-span-2">
            <Detail label={t("crmNotes")}>{customer.notes || t("noSpecialNotes")}</Detail>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("plotBookings")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("dealsCount", { count: saleList.length })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("bookingCode")}</TableHead>
              <TableHead>{t("societyBlock")}</TableHead>
              <TableHead>{t("plotUnitNo")}</TableHead>
              <TableHead>{t("propertyType")}</TableHead>
              <TableHead>{t("areaSize")}</TableHead>
              <TableHead>{t("salePrice")}</TableHead>
              <TableHead>{t("balanceDue")}</TableHead>
              <TableHead>{t("dealStatus")}</TableHead>
              <TableHead className="text-right">{t("action")}</TableHead>
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
                      {sale.is_external ? (
                        <>
                          <span className="font-medium">{t("external")}</span>
                          {sale.external_location && (
                            <span className="text-xs text-muted-foreground ml-1">
                              · {sale.external_location}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{society?.name ?? tCommon("dash")}</span>
                          {block?.name && (
                            <span className="text-xs text-muted-foreground ml-1">· {t("block", { name: block.name })}</span>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {sale.plot_no}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tPropType(sale.property_type as keyof typeof PROPERTY_TYPE_LABELS)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(sale.area, locale)} {tUnit(sale.area_unit as keyof typeof AREA_UNIT_LABELS)}
                    </TableCell>
                    <TableCell className="font-semibold">{formatPkr(sale.sale_amount, locale)}</TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatPkr(sale.remaining_amount, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md">
                        {tSale(sale.status as keyof typeof SALE_STATUS_LABELS)} ·{" "}
                        {tPayType(sale.payment_type as keyof typeof PAYMENT_TYPE_LABELS)}
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
                          {t("receive")}
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {t("paidInFull")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  {t("emptyBookings")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("emiPlan")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("scheduledInstallments", { count: installmentList.length })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("milestoneNo")}</TableHead>
              <TableHead>{t("plotBooking")}</TableHead>
              <TableHead>{t("periodDescription")}</TableHead>
              <TableHead>{t("dueDate")}</TableHead>
              <TableHead>{t("scheduledAmount")}</TableHead>
              <TableHead>{t("receivedToDate")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              {canEdit ? <TableHead className="text-right">{t("action")}</TableHead> : null}
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
                      <div className="font-medium">{row.sale?.plot_no ?? tCommon("dash")}</div>
                      <div className="font-mono text-xs text-muted-foreground">{row.sale?.code}</div>
                    </TableCell>
                    <TableCell>{row.period_label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(row.due_date, locale)}</TableCell>
                    <TableCell className="font-semibold">{formatPkr(row.scheduled_amount, locale)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(row.received_amount, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.status === "overdue" ? "destructive" : "secondary"}
                        className="rounded-md font-normal"
                      >
                        {tInst(row.status as keyof typeof INSTALLMENT_STATUS_LABELS)}
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
                            {t("receive")}
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t("cleared")}</span>
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
                  {t("emptyInstallments")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("paymentReceipts")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("receiptsCount", { count: (receipts ?? []).length })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("receiptNo")}</TableHead>
              <TableHead>{tCommon("date")}</TableHead>
              <TableHead>{t("linkedPlot")}</TableHead>
              <TableHead>{t("paymentMode")}</TableHead>
              <TableHead>{tCommon("amount")}</TableHead>
              <TableHead className="text-right">{t("printVoucher")}</TableHead>
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
                    <TableCell className="text-xs text-muted-foreground">{formatDate(receipt.payment_date, locale)}</TableCell>
                    <TableCell>
                      {sale?.plot_no ? (
                        <div>
                          <span className="font-medium">{sale.plot_no}</span>
                          <span className="ml-1 text-xs text-muted-foreground font-mono">({sale.code})</span>
                        </div>
                      ) : (
                        tCommon("dash")
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tPayMode(receipt.payment_mode as keyof typeof PAYMENT_MODE_LABELS)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(receipt.amount, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-md"
                        render={<Link href={`/receipts/${receipt.id}`} />}
                      >
                        <Printer className="size-3 mr-1" />
                        {tCommon("print")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t("emptyReceipts")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {saleList.some((s: any) => s.agent_commissions?.length > 0) && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Handshake className="size-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">{t("brokerCommissions")}</h2>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("agentBroker")}</TableHead>
                <TableHead>{t("bookingDeal")}</TableHead>
                <TableHead>{tCommon("phone")}</TableHead>
                <TableHead>{t("commissionAmountCol")}</TableHead>
                <TableHead>{t("payoutStatus")}</TableHead>
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
                          t("broker")
                        )}
                      </TableCell>
                      <TableCell>
                        {s.plot_no} ({s.code})
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{agent?.phone ?? tCommon("dash")}</TableCell>
                      <TableCell className="font-semibold">{formatPkr(c.commission_amount, locale)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-md">
                          {tCommission(c.status)}
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
