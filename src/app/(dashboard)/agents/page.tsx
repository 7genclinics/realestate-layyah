import Link from "next/link";
import { Plus, ExternalLink, Briefcase, Users, DollarSign, Wallet } from "lucide-react";
import { getAgents } from "@/lib/agents";
import { formatPkr } from "@/lib/format";
import { AGENT_TYPE_LABELS, AGENT_STATUS_LABELS } from "@/lib/constants";
import { deleteAgent } from "@/lib/actions/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { RowActions } from "@/components/features/row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const { data: agents, total } = await getAgents({ page, pageSize: PAGE_SIZE });

  const totalCommissions = agents.reduce((s: number, a: any) => s + Number(a.total_commission || 0), 0);
  const totalPaid = agents.reduce((s: number, a: any) => s + Number(a.total_paid || 0), 0);
  const totalUnpaid = totalCommissions - totalPaid;
  const overseasCount = agents.filter((a: any) => a.agent_type === "overseas").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Agents &amp; Brokers
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage local &amp; overseas brokers, commission disbursements, and payout histories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/agents/portal" />}>
            <ExternalLink className="size-4" />
            Agent Portal
          </Button>
          <Button render={<Link href="/agents/new" />}>
            <Plus className="size-4" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Registered Agents"
          value={total}
          hint={`${overseasCount} overseas broker${overseasCount === 1 ? "" : "s"}`}
          icon={Users}
          variant="sky"
        />
        <StatCard
          title="Total Commission Earned"
          value={formatPkr(totalCommissions)}
          hint={`${formatPkr(totalPaid)} already disbursed`}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title="Outstanding Payable"
          value={formatPkr(totalUnpaid)}
          hint="Pending broker commission vouchers"
          icon={Wallet}
          variant="warning"
          href="/cash-book"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Brokers &amp; Agency Directory</h2>
          </div>
          <span className="text-xs text-muted-foreground">{total} total brokers</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Agency / Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Commission Rate</TableHead>
              <TableHead>Total Earned</TableHead>
              <TableHead>Balance Payable</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.length ? (
              agents.map((agent: any) => (
                <TableRow key={agent.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="font-semibold text-primary hover:underline underline-offset-4"
                    >
                      {agent.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{agent.agency_name || "Independent"}</div>
                    <div className="text-xs text-muted-foreground">{agent.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-md font-normal">
                      {AGENT_TYPE_LABELS[agent.agent_type as keyof typeof AGENT_TYPE_LABELS] ?? agent.agent_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{Number(agent.commission_rate ?? 0)}%</TableCell>
                  <TableCell className="font-semibold">{formatPkr(agent.total_commission)}</TableCell>
                  <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                    {formatPkr(agent.balance_payable)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md">
                      {AGENT_STATUS_LABELS[agent.status as keyof typeof AGENT_STATUS_LABELS] ?? agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      id={agent.id}
                      viewHref={`/agents/${agent.id}`}
                      editHref={`/agents/${agent.id}/edit`}
                      deleteAction={deleteAgent}
                      confirmMessage={`Delete broker "${agent.name}"? All commissions and payouts will also be removed.`}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No agents registered yet. Click &quot;Add Agent&quot; to register brokers.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} total={total} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
