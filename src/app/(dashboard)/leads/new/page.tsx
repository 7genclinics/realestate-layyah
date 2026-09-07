import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { canManageLeads } from "@/lib/permissions";
import { LeadForm } from "@/components/features/lead-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewLeadPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.leads");
  const tCommon = await getTranslations("common");

  if (!canManageLeads(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("addTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/leads" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: societies }, { data: agents }] = await Promise.all([
    supabase
      .from("societies")
      .select("id, name")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("agents")
      .select("id, name")
      .eq("status", "active")
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("addTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("addSubtitle")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
          <CardDescription>
            {t("detailsHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm societies={societies ?? []} agents={agents ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
