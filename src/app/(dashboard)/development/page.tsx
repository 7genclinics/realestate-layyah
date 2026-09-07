import Link from "next/link";
import { Plus, Building, DollarSign, PieChart, Hammer, Receipt } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getDevelopmentProjects, getDevelopmentExpenses } from "@/lib/development";
import { formatPkr, formatDate } from "@/lib/format";
import { DEVELOPMENT_CATEGORY_LABELS, DEVELOPMENT_STATUS_LABELS } from "@/lib/constants";
import {
  deleteDevelopmentProject,
  deleteDevelopmentExpense,
} from "@/lib/actions/development";
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

export default async function DevelopmentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; epage?: string }>;
}) {
  const { page: pageStr, epage: epageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const epage = Math.max(1, parseInt(epageStr ?? "1", 10));
  const locale = await getLocale();
  const t = await getTranslations("pages.development");
  const tCat = await getTranslations("labels.developmentCategory");
  const tStatus = await getTranslations("labels.developmentStatus");
  const tCommon = await getTranslations("common");

  const [{ data: projects, total: projTotal }, { data: expenses, total: expTotal }] =
    await Promise.all([
      getDevelopmentProjects({ page, pageSize: PAGE_SIZE }),
      getDevelopmentExpenses({ page: epage, pageSize: PAGE_SIZE }),
    ]);

  const totalBudget = projects.reduce((s: number, p: any) => s + Number(p.budget || 0), 0);
  const totalSpent = projects.reduce((s: number, p: any) => s + Number(p.total_spent || 0), 0);
  const remaining = totalBudget - totalSpent;
  const percentRemaining = totalBudget > 0 ? ((remaining / totalBudget) * 100).toFixed(1) : "100";

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
        <Button render={<Link href="/development/new" />}>
          <Plus className="size-4" />
          {t("addProject")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t("totalBudget")}
          value={formatPkr(totalBudget, locale)}
          hint={t("projectsHint", { count: projTotal })}
          icon={Building}
          variant="primary"
        />
        <StatCard
          title={t("totalSpend")}
          value={formatPkr(totalSpent, locale)}
          hint={t("spendHint")}
          icon={DollarSign}
          variant="warning"
          href="/cash-book"
        />
        <StatCard
          title={t("remainingBudget")}
          value={formatPkr(remaining, locale)}
          hint={t("remainingHint", { percent: percentRemaining })}
          icon={PieChart}
          variant={remaining >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Projects Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Hammer className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("projectsBudgets")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("projectsCount", { count: projTotal })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("projectName")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{tCommon("society")}</TableHead>
              <TableHead>{t("budget")}</TableHead>
              <TableHead>{t("totalSpentCol")}</TableHead>
              <TableHead>{t("remainingCol")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length ? (
              projects.map((proj: any) => {
                const society = Array.isArray(proj.societies) ? proj.societies[0] : proj.societies;
                return (
                  <TableRow key={proj.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{proj.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tCat(proj.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {society?.name ? (
                        <Link href="/societies" className="text-primary hover:underline underline-offset-4">
                          {society.name}
                        </Link>
                      ) : tCommon("dash")}
                    </TableCell>
                    <TableCell className="font-semibold">{formatPkr(proj.budget, locale)}</TableCell>
                    <TableCell className="font-medium text-amber-600 dark:text-amber-400">
                      {formatPkr(proj.total_spent, locale)}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatPkr(proj.remaining_budget, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md">
                        {tStatus(proj.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        id={proj.id}
                        editHref="/development/new"
                        deleteAction={deleteDevelopmentProject}
                        confirmMessage={t("deleteProject", { name: proj.name })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  {t("emptyProjects")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} total={projTotal} pageSize={PAGE_SIZE} params={{ page: pageStr }} />
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("recentVouchers")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("vouchersCount", { count: expTotal })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("expenseDate")}</TableHead>
              <TableHead>{t("projectName")}</TableHead>
              <TableHead>{t("vendorParty")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead>{tCommon("amount")}</TableHead>
              <TableHead>{t("cashAccount")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length ? (
              expenses.map((exp: any) => {
                const project = Array.isArray(exp.development_projects) ? exp.development_projects[0] : exp.development_projects;
                const party = Array.isArray(exp.parties) ? exp.parties[0] : exp.parties;
                const account = Array.isArray(exp.cash_accounts) ? exp.cash_accounts[0] : exp.cash_accounts;
                return (
                  <TableRow key={exp.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(exp.expense_date, locale)}</TableCell>
                    <TableCell className="font-medium">{project?.name ?? tCommon("dash")}</TableCell>
                    <TableCell>
                      {party?.id ? (
                        <Link href={`/parties/${party.id}`} className="text-primary hover:underline underline-offset-4">
                          {party.name}
                        </Link>
                      ) : (
                        party?.name ?? t("directSpend")
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{exp.description}</TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatPkr(exp.amount, locale)}
                    </TableCell>
                    <TableCell>
                      <Link href="/cash-book" className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
                        {account?.name ?? t("cashBox")}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        id={exp.id}
                        deleteAction={deleteDevelopmentExpense}
                        confirmMessage={t("deleteExpense")}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("emptyExpenses")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={epage}
          total={expTotal}
          pageSize={PAGE_SIZE}
          params={{ epage: epageStr }}
        />
      </div>
    </div>
  );
}
