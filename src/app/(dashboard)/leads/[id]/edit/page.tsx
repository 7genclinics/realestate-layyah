import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { canManageLeads } from "@/lib/permissions";
import { LeadForm } from "@/components/features/lead-form";
import type { LeadFormValues } from "@/lib/validations/lead";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
  const { id } = await params;
  const t = await getTranslations("pages.leads");
  const tCommon = await getTranslations("common");

  if (!canManageLeads(profile.role)) {
    redirect(`/leads/${id}`);
  }

  const supabase = await createClient();
  const [{ data: lead }, { data: societies }, { data: agents }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, full_name, phone, source, status, society_id, agent_id, interest, budget, notes",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("societies")
        .select("id, name")
        .is("deleted_at", null)
        .order("name"),
      supabase.from("agents").select("id, name").eq("status", "active").order("name"),
    ]);

  if (!lead) {
    notFound();
  }

  const defaults: Partial<LeadFormValues> = {
    full_name: lead.full_name,
    phone: lead.phone ?? "",
    source: lead.source,
    status: lead.status as LeadFormValues["status"],
    society_id: lead.society_id ?? "",
    agent_id: lead.agent_id ?? "",
    interest: lead.interest ?? "",
    budget: lead.budget ? Number(lead.budget) : undefined,
    notes: lead.notes ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("editSubtitle", { name: lead.full_name })}</p>
        </div>
        <Button render={<Link href={`/leads/${id}`} />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
          <CardDescription>{t("updateEnquiry")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm
            leadId={lead.id}
            defaultValues={defaults}
            societies={societies ?? []}
            agents={agents ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
