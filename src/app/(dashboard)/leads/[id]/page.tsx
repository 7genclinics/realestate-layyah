import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Phone, Target } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getActivities } from "@/lib/audit";
import { createClient } from "@/lib/server";
import { canManageLeads } from "@/lib/permissions";
import {
  ACTIVITY_TYPE_LABELS,
  CUSTOMER_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/constants";
import { formatDateTime, formatPkr } from "@/lib/format";
import { LeadActionsPanel } from "@/components/features/lead-actions-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
  const { id } = await params;

  if (!canManageLeads(profile.role)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, code, full_name, phone, source, status, interest, budget, notes, converted_customer_id, created_at, societies(name), agents(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!lead) {
    notFound();
  }

  const society = Array.isArray(lead.societies) ? lead.societies[0] : lead.societies;
  const agent = Array.isArray(lead.agents) ? lead.agents[0] : lead.agents;
  const activities = await getActivities("lead", id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/leads" />}
            variant="outline"
            size="icon-xs"
            className="size-8"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {lead.full_name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {lead.phone || "No phone"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-md">
            {LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] ??
              lead.status}
          </Badge>
          <Button render={<Link href={`/leads/${id}/edit`} />} variant="outline">
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enquiry details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
              <Detail label="Source">
                {CUSTOMER_SOURCE_LABELS[
                  lead.source as keyof typeof CUSTOMER_SOURCE_LABELS
                ] ?? lead.source}
              </Detail>
              <Detail label="Budget">
                {lead.budget ? formatPkr(Number(lead.budget)) : "—"}
              </Detail>
              <Detail label="Interested society">{society?.name ?? "—"}</Detail>
              <Detail label="Referring agent">{agent?.name ?? "—"}</Detail>
              <Detail label="Interest" span>
                {lead.interest || "—"}
              </Detail>
              <Detail label="Notes" span>
                {lead.notes || "—"}
              </Detail>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length ? (
                <ol className="relative space-y-4 border-l pl-5">
                  {activities.map((activity) => (
                    <li key={activity.id} className="relative">
                      <span className="absolute -left-[23px] top-1 size-3 rounded-full border-2 border-background bg-primary" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {ACTIVITY_TYPE_LABELS[
                            activity.activity_type as keyof typeof ACTIVITY_TYPE_LABELS
                          ] ?? activity.activity_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(activity.created_at)}
                        </span>
                      </div>
                      {activity.subject ? (
                        <p className="text-sm font-medium">{activity.subject}</p>
                      ) : null}
                      {activity.body ? (
                        <p className="text-sm text-muted-foreground">{activity.body}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {activity.actor?.full_name ?? "System"}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity logged yet. Use the panel to record calls, visits
                  and status changes.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-primary" />
                Pipeline actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadActionsPanel
                leadId={lead.id}
                currentStatus={lead.status}
                converted={Boolean(lead.converted_customer_id)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? "sm:col-span-2" : undefined}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{children}</p>
    </div>
  );
}
