import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  CreditCard,
  DollarSign,
  Handshake,
  Landmark,
  Percent,
  Plus,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
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
              Back to Agents
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-mono">{agent.agency_name || "Independent"}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{agent.name}</h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {AGENT_TYPE_LABELS[agent.agent_type as keyof typeof AGENT_TYPE_LABELS] ?? agent.agent_type}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {AGENT_STATUS_LABELS[agent.status as keyof typeof AGENT_STATUS_LABELS] ?? agent.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Agency: {agent.agency_name || "Independent"} · Phone: {agent.phone} · Agreed Commission Rate: {agent.commission_rate}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button render={<Link href="/agents/portal" />} variant="outline">
            Agent Portal View
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Commission Earned"
          value={formatPkr(totalCommission)}
          hint={`${agent.commissions.length} booked deals`}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title="Total Disbursed"
          value={formatPkr(totalPaid)}
          hint={`${agent.payouts.length} payout vouchers`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Outstanding Payable"
          value={formatPkr(balance)}
          hint="Unpaid broker commission"
          icon={Wallet}
          variant={balance > 0 ? "warning" : "default"}
          href="/cash-book"
        />
        <StatCard
          title="Standard Rate"
          value={`${agent.commission_rate}%`}
          hint="Per sale transaction rate"
          icon={Percent}
          variant="sky"
        />
      </div>

      {/* Forms Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Record Commission Form */}
        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-base font-semibold text-foreground">Record Deal Commission</h2>
            <p className="text-xs text-muted-foreground">Attach a broker commission voucher to a customer sale deal.</p>
          </div>
          <form action={recordAgentCommission} className="space-y-4">
            <input type="hidden" name="agent_id" value={agent.id} />
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Select Customer Sale Deal *
              </label>
              <select
                name="sale_id"
                required
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Choose Sale Booking</option>
                {(sales || []).map((s: any) => {
                  const cust = Array.isArray(s.customers) ? s.customers[0] : s.customers;
                  return (
                    <option key={s.id} value={s.id}>
                      {cust?.full_name ?? "Buyer"} — Plot #{s.plot_no} ({formatPkr(s.sale_amount)})
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Commission Amount (PKR) *
              </label>
              <input
                type="number"
                name="commission_amount"
                step="0.01"
                required
                placeholder="e.g. 50000"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Notes &amp; Deal Remarks
              </label>
              <input
                type="text"
                name="notes"
                placeholder="e.g. 1.5% commission on Plot #45-B"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button type="submit">
              <Plus className="size-4" />
              Record Commission Voucher
            </Button>
          </form>
        </div>

        {/* Record Payout Form */}
        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-base font-semibold text-foreground">Disburse Commission Payout</h2>
            <p className="text-xs text-muted-foreground">Post payment voucher directly into the Cash Book.</p>
          </div>
          <form action={recordAgentPayout} className="space-y-4">
            <input type="hidden" name="agent_id" value={agent.id} />
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Payout Amount (PKR) *
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                placeholder="e.g. 25000"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Cash Box / Bank Account *
              </label>
              <select
                name="cash_account_id"
                required
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select Cash/Bank Account</option>
                {(accounts || []).map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Bank Cheque / Online Reference #
              </label>
              <input
                type="text"
                name="reference_no"
                placeholder="e.g. Chq #0981726 or HBL-TRF-99"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button type="submit">
              <Receipt className="size-4" />
              Post Payout Voucher
            </Button>
          </form>
        </div>
      </div>

      {/* Commissions History Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Handshake className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Commissions Ledger</h2>
          </div>
          <span className="text-xs text-muted-foreground">{agent.commissions.length} commissions</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer Buyer</TableHead>
              <TableHead>Plot / Booking</TableHead>
              <TableHead>Commission Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agent.commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No commissions recorded for this broker yet.
                </TableCell>
              </TableRow>
            ) : (
              agent.commissions.map((c: any) => {
                const sale = Array.isArray(c.sales) ? c.sales[0] : c.sales;
                const cust = Array.isArray(sale?.customers) ? sale?.customers[0] : sale?.customers;
                return (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {cust ? (
                        <Link href={`/customers/${cust.id}`} className="text-primary hover:underline underline-offset-4">
                          {cust.full_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {sale ? `Plot ${sale.plot_no} (${sale.code})` : "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatPkr(c.commission_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md">
                        {c.status}
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
                            ? `${cust?.full_name ?? "Buyer"} — Plot ${sale.plot_no} (${sale.code})`
                            : "this deal"
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

      {/* Payouts History Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Disbursed Commission Payout History</h2>
          </div>
          <span className="text-xs text-muted-foreground">{agent.payouts.length} payout vouchers</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payout Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Reference No</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agent.payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No payout vouchers disbursed yet.
                </TableCell>
              </TableRow>
            ) : (
              agent.payouts.map((p: any) => {
                const acc = Array.isArray(p.cash_accounts) ? p.cash_accounts[0] : p.cash_accounts;
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(p.payout_date)}</TableCell>
                    <TableCell className="font-medium">{acc?.name ?? "Cash Box"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference_no || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {PAYMENT_MODE_LABELS[p.payment_mode as keyof typeof PAYMENT_MODE_LABELS] ?? p.payment_mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">
                      {formatPkr(p.amount)}
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
