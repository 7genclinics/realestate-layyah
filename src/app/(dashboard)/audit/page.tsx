import { redirect } from "next/navigation";
import { History, ShieldCheck } from "lucide-react";
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
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground">
          Immutable trail of every important change — who did what, and when.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Recorded Events"
          value={entries.length}
          hint="Most recent 300 shown"
          icon={History}
          variant="sky"
        />
        <StatCard
          title="Events Today"
          value={todayCount}
          hint="Since midnight"
          icon={ShieldCheck}
          variant="primary"
        />
        <StatCard
          title="Active Users"
          value={actorCount}
          hint="Distinct actors in this window"
          icon={ShieldCheck}
          variant="warning"
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Activity Trail</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {entries.length} events
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length ? (
              entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.actor?.full_name ?? "System"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ACTION_TONE[entry.action] ?? "outline"}
                      className="rounded-md font-normal"
                    >
                      {AUDIT_ACTION_LABELS[
                        entry.action as keyof typeof AUDIT_ACTION_LABELS
                      ] ?? entry.action}
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
                  No audit events recorded yet. Actions like bookings, receipts and
                  approvals will appear here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
