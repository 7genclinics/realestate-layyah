import Link from "next/link";
import { Plus, ExternalLink, Briefcase, Users, DollarSign, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getAgents } from "@/lib/agents";
import { formatPkr } from "@/lib/format";
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
  const locale = await getLocale();
  const t = await getTranslations("agents");
  const tTypes = await getTranslations("labels.agentType");
  const tStatus = await getTranslations("labels.agentStatus");
  const tCommon = await getTranslations("common");

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
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/agents/portal" />}>
            <ExternalLink className="size-4" />
            {t("portal")}
          </Button>
          <Button render={<Link href="/agents/new" />}>
            <Plus className="size-4" />
            {t("addAgent")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t("totalRegistered")}
          value={total}
          hint={
            overseasCount === 1
              ? t("overseasBrokerOne", { count: overseasCount })
              : t("overseasBrokers", { count: overseasCount })
          }
          icon={Users}
          variant="sky"
        />
        <StatCard
          title={t("totalCommissionEarned")}
          value={formatPkr(totalCommissions, locale)}
          hint={t("alreadyDisbursed", { amount: formatPkr(totalPaid, locale) })}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title={t("outstandingPayable")}
          value={formatPkr(totalUnpaid, locale)}
          hint={t("pendingVouchers")}
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
            <h2 className="font-semibold text-sm">{t("directory")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("totalBrokers", { total })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("agencyContact")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("commissionRate")}</TableHead>
              <TableHead>{t("totalEarned")}</TableHead>
              <TableHead>{t("balancePayable")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
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
                    <div className="font-medium">{agent.agency_name || tCommon("independent")}</div>
                    <div className="text-xs text-muted-foreground">{agent.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-md font-normal">
                      {tTypes(agent.agent_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{Number(agent.commission_rate ?? 0)}%</TableCell>
                  <TableCell className="font-semibold">{formatPkr(agent.total_commission, locale)}</TableCell>
                  <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                    {formatPkr(agent.balance_payable, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md">
                      {tStatus(agent.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      id={agent.id}
                      viewHref={`/agents/${agent.id}`}
                      editHref={`/agents/${agent.id}/edit`}
                      deleteAction={deleteAgent}
                      confirmMessage={t("deleteConfirm", { name: agent.name })}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  {t("empty")}
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
