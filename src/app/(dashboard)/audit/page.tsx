import { redirect } from "next/navigation";
import { History, ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { getRecentAudit } from "@/lib/audit";
import { canViewAudit } from "@/lib/permissions";
import { AUDIT_ACTION_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTION_TONE: Record<string, "secondary" | "outline" | "destructive"> = {
  create: "secondary",
  update: "outline",
  delete: "destructive",
  approve: "secondary",
  reject: "destructive",
  status_change: "outline",
  payment: "secondary",
  login: "outline",
};

export default async function AuditLogPage() {
  const { profile } = await requireProfile();

  if (!canViewAudit(profile.role)) {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  const t = await getTranslations("pages.audit");
  const tAction = await getTranslations("labels.auditAction");
  const tCommon = await getTranslations("common");

  const entries = await getRecentAudit(300);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = entries.filter(
    (e) => new Date(e.created_at) >= today,
  ).length;
  const actorCount = new Set(entries.map((e) => e.actor_id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t("recordedEvents")}
          value={entries.length}
          hint={t("recentHint")}
          icon={History}
          variant="sky"
        />
        <StatCard
          title={t("eventsToday")}
          value={todayCount}
          hint={t("sinceMidnight")}
          icon={ShieldCheck}
          variant="primary"
        />
        <StatCard
          title={t("activeUsers")}
          value={actorCount}
          hint={t("actorsHint")}
          icon={ShieldCheck}
          variant="warning"
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("activityTrail")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("eventsCount", { count: entries.length })}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("when")}</TableHead>
              <TableHead>{t("actor")}</TableHead>
              <TableHead>{t("action")}</TableHead>
              <TableHead>{t("entity")}</TableHead>
              <TableHead>{t("summary")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length ? (
              entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(entry.created_at, locale)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.actor?.full_name ?? t("system")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ACTION_TONE[entry.action] ?? "outline"}
                      className="rounded-md font-normal"
                    >
                      {tAction(entry.action as never)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {entry.entity_type}
                  </TableCell>
                  <TableCell>{entry.summary}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
