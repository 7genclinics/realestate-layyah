import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Target, Flame, Trophy, PhoneCall } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { canManageLeads } from "@/lib/permissions";
import {
  CUSTOMER_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { deleteLead } from "@/lib/actions/leads";
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

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  new: "secondary",
  contacted: "secondary",
  interested: "outline",
  negotiation: "outline",
  won: "default",
  lost: "destructive",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { profile } = await requireProfile();

  if (!canManageLeads(profile.role)) {
    redirect("/dashboard");
  }

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("pages.leads");
  const tSource = await getTranslations("labels.customerSource");
  const tStatus = await getTranslations("labels.leadStatus");
  const tCommon = await getTranslations("common");

  const [{ count }, { data: leads }, { data: allStatuses }] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select(
        "id, code, full_name, phone, source, status, interest, budget, created_at, societies(name)",
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.from("leads").select("status"),
  ]);

  const statuses = allStatuses ?? [];
  const openCount = statuses.filter(
    (l) => l.status !== "won" && l.status !== "lost",
  ).length;
  const hotCount = statuses.filter(
    (l) => l.status === "interested" || l.status === "negotiation",
  ).length;
  const wonCount = statuses.filter((l) => l.status === "won").length;

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
        <Button render={<Link href="/leads/new" />}>
          <Plus className="size-4" />
          {t("addLead")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("totalLeads")}
          value={count ?? 0}
          hint={t("totalHint")}
          icon={Target}
          variant="sky"
        />
        <StatCard
          title={t("openPipeline")}
          value={openCount}
          hint={t("openHint")}
          icon={PhoneCall}
          variant="primary"
        />
        <StatCard
          title={t("hotLeads")}
          value={hotCount}
          hint={t("hotHint")}
          icon={Flame}
          variant="warning"
        />
        <StatCard
          title={t("converted")}
          value={wonCount}
          hint={t("convertedHint")}
          icon={Trophy}
          variant="success"
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("directory")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("totalCount", { count: count ?? 0 })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("name")}</TableHead>
              <TableHead>{t("contact")}</TableHead>
              <TableHead>{t("source")}</TableHead>
              <TableHead>{t("interest")}</TableHead>
              <TableHead>{t("budget")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads?.length ? (
              leads.map((lead) => {
                const society = Array.isArray(lead.societies)
                  ? lead.societies[0]
                  : lead.societies;
                return (
                  <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold text-primary hover:underline underline-offset-4"
                      >
                        {lead.full_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(lead.created_at, locale)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.phone || tCommon("dash")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tSource(lead.source as keyof typeof CUSTOMER_SOURCE_LABELS)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.interest || society?.name || tCommon("dash")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.budget ? formatPkr(Number(lead.budget), locale) : tCommon("dash")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[lead.status] ?? "outline"}
                        className="rounded-md"
                      >
                        {tStatus(lead.status as keyof typeof LEAD_STATUS_LABELS)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        id={lead.id}
                        viewHref={`/leads/${lead.id}`}
                        editHref={`/leads/${lead.id}/edit`}
                        deleteAction={deleteLead}
                        confirmMessage={t("deleteConfirm", { name: lead.full_name })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
