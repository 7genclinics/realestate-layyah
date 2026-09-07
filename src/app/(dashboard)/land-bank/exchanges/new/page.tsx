import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageLandBank } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { LandExchangeForm } from "@/components/features/land-exchange-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewLandExchangePage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.landBank");
  const tCommon = await getTranslations("common");

  if (!canManageLandBank(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newExchangePage")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noExchangePermission")}
        </p>
        <Button render={<Link href="/land-bank" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: societies }, { data: parties }, { data: properties }, { data: parcels }] =
    await Promise.all([
      supabase.from("societies").select("id, code, name").order("name"),
      supabase
        .from("parties")
        .select("id, code, name")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("properties")
        .select("id, code, plot_no")
        .is("deleted_at", null)
        .neq("status", "transferred")
        .order("plot_no"),
      supabase
        .from("land_parcels")
        .select("id, code, title")
        .neq("status", "transferred")
        .order("created_at", { ascending: false }),
    ]);

  if (!societies?.length || !parties?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newExchangePage")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("needSocietyParty")}
        </p>
        <Button render={<Link href="/parties/new" />}>{t("addParty")}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("exchangeDetail")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("newExchangeSubtitle")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("exchangeDeal")}</CardTitle>
          <CardDescription>
            {t("differenceHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LandExchangeForm
            societies={societies}
            parties={parties}
            properties={properties ?? []}
            parcels={parcels ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
