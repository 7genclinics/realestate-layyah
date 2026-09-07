import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageLandBank } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { LandParcelForm } from "@/components/features/land-parcel-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewLandPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.landBank");
  const tCommon = await getTranslations("common");

  if (!canManageLandBank(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("addLand")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/land-bank" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: societies }, { data: parties }] = await Promise.all([
    supabase.from("societies").select("id, code, name").order("name"),
    supabase
      .from("parties")
      .select("id, code, name")
      .eq("status", "active")
      .order("name"),
  ]);

  if (!societies?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("addLand")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("needSociety")}
        </p>
        <Button render={<Link href="/societies" />}>{t("goToSocieties")}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("addLand")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("newParcelSubtitle")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("landDetails")}</CardTitle>
          <CardDescription>
            {t("khasraHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LandParcelForm societies={societies} parties={parties ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
