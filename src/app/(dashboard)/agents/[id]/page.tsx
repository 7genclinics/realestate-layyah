import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Handshake,
  Percent,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getAgentById } from "@/lib/agents";
import { createClient } from "@/lib/server";
import { recordAgentCommission, recordAgentPayout } from "@/lib/actions/agents";
import { formatPkr, formatDate } from "@/lib/format";
import { AGENT_TYPE_LABELS, AGENT_STATUS_LABELS, PAYMENT_MODE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommissionEditDialog } from "@/components/features/commission-edit-dialog";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) {
    notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations("agents");
  const tTypes = await getTranslations("labels.agentType");
  const tStatus = await getTranslations("labels.agentStatus");
  const tCommission = await getTranslations("labels.commissionStatus");
  const tPay = await getTranslations("labels.paymentMode");
  const tCommon = await getTranslations("common");

  const supabase = await createClient();
  const [{ data: sales }, { data: accounts }] = await Promise.all([
    supabase
      .from("sales")
      .select("id, code, plot_no, sale_amount, customers (id, full_name, code)")
      .order("created_at", { ascending: false }),
    supabase
      .from("cash_accounts")
      .select("id, name, account_type")
      .eq("is_active", true),
  ]);

  const totalCommission = agent.commissions.reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);
  const totalPaid = agent.payouts.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const balance = totalCommission - totalPaid;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/agents"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {t("backToAgents")}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-mono">{agent.agency_name || tCommon("independent")}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{agent.name}</h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {tTypes(agent.agent_type as keyof typeof AGENT_TYPE_LABELS)}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {tStatus(agent.status as keyof typeof AGENT_STATUS_LABELS)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t("agencyLine", {
              agency: agent.agency_name || tCommon("independent"),
              phone: agent.phone,
              rate: Number(agent.commission_rate ?? 0),
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button render={<Link href="/agents/portal" />} variant="outline">
            {t("agentPortalView")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("totalCommissionEarned")}
          value={formatPkr(totalCommission, locale)}
          hint={t("bookedDeals", { count: agent.commissions.length })}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title={t("totalDisbursed")}
          value={formatPkr(totalPaid, locale)}
          hint={t("payoutVouchers", { count: agent.payouts.length })}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title={t("outstandingPayable")}
          value={formatPkr(balance, locale)}
          hint={t("unpaidBroker")}
          icon={Wallet}
          variant={balance > 0 ? "warning" : "default"}
          href="/cash-book"
        />
        <StatCard
          title={t("standardRate")}
          value={`${agent.commission_rate}%`}
          hint={t("perSaleRate")}
          icon={Percent}
          variant="sky"
        />
      </div>

      {/* Forms Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-base font-semibold text-foreground">{t("recordDeal")}</h2>
            <p className="text-xs text-muted-foreground">{t("recordDealHint")}</p>
          </div>
          <form action={recordAgentCommission} className="space-y-4">
            <input type="hidden" name="agent_id" value={agent.id} />
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                {t("selectSale")}
              </label>
              <select
                name="sale_id"
                required
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("chooseSale")}</option>
                {(sales || []).map((s: any) => {
                  const cust = Array.isArray(s.customers) ? s.customers[0] : s.customers;
                  return (
                    <option key={s.id} value={s.id}>
                      {t("buyerPlotAmount", {
                        buyer: cust?.full_name ?? tCommon("buyer"),
                        plot: s.plot_no,
                        amount: formatPkr(s.sale_amount, locale),
                      })}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                {t("commissionAmount")}
              </label>
              <input
                type="number"
                name="commission_amount"
                step="0.01"
                required
                placeholder={t("commissionPlaceholder")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                {t("notesRemarks")}
              </label>
              <input
                type="text"
                name="notes"
                placeholder={t("notesPlaceholder")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button type="submit">
              <Plus className="size-4" />
              {t("recordVoucher")}
            </Button>
          </form>
        </div>

        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-base font-semibold text-foreground">{t("disburse")}</h2>
            <p className="text-xs text-muted-foreground">{t("disburseHint")}</p>
          </div>
          <form action={recordAgentPayout} className="space-y-4">
            <input type="hidden" name="agent_id" value={agent.id} />
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                {t("payoutAmount")}
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                placeholder={t("payoutPlaceholder")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                {t("cashAccount")}
              </label>
              <select
                name="cash_account_id"
                required
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("selectAccount")}</option>
                {(accounts || []).map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                {t("chequeRef")}
              </label>
              <input
                type="text"
                name="reference_no"
                placeholder={t("chequePlaceholder")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button type="submit">
              <Receipt className="size-4" />
              {t("postPayout")}
            </Button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Handshake className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("ledger")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("commissionsCount", { count: agent.commissions.length })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("date")}</TableHead>
              <TableHead>{t("customerBuyer")}</TableHead>
              <TableHead>{t("plotBooking")}</TableHead>
              <TableHead>{t("commissionAmountCol")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agent.commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t("emptyCommissions")}
                </TableCell>
              </TableRow>
            ) : (
              agent.commissions.map((c: any) => {
                const sale = Array.isArray(c.sales) ? c.sales[0] : c.sales;
                const cust = Array.isArray(sale?.customers) ? sale?.customers[0] : sale?.customers;
                return (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(c.created_at, locale)}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {cust ? (
                        <Link href={`/customers/${cust.id}`} className="text-primary hover:underline underline-offset-4">
                          {cust.full_name}
                        </Link>
                      ) : (
                        tCommon("dash")
                      )}
                    </TableCell>
                    <TableCell>
                      {sale ? t("plotCode", { plot: sale.plot_no, code: sale.code }) : tCommon("dash")}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatPkr(c.commission_amount, locale)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md">
                        {tCommission(c.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <CommissionEditDialog
                        id={c.id}
                        commissionAmount={Number(c.commission_amount)}
                        notes={c.notes}
                        status={c.status}
                        dealLabel={
                          sale
                            ? `${cust?.full_name ?? tCommon("buyer")} — ${t("plotCode", { plot: sale.plot_no, code: sale.code })}`
                            : t("thisDeal")
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("payoutHistory")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("payoutCount", { count: agent.payouts.length })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("payoutDate")}</TableHead>
              <TableHead>{t("account")}</TableHead>
              <TableHead>{t("referenceNo")}</TableHead>
              <TableHead>{t("paymentMode")}</TableHead>
              <TableHead className="text-right">{t("amountPaid")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agent.payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("emptyPayouts")}
                </TableCell>
              </TableRow>
            ) : (
              agent.payouts.map((p: any) => {
                const acc = Array.isArray(p.cash_accounts) ? p.cash_accounts[0] : p.cash_accounts;
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(p.payout_date, locale)}</TableCell>
                    <TableCell className="font-medium">{acc?.name ?? tCommon("cashBox")}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference_no || tCommon("dash")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tPay(p.payment_mode as keyof typeof PAYMENT_MODE_LABELS)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">
                      {formatPkr(p.amount, locale)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
