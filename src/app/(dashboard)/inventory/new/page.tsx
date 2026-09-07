import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageInventory } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { PropertyForm } from "@/components/features/property-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewPropertyPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.inventory");
  const tCommon = await getTranslations("common");

  if (!canManageInventory(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("addTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/inventory" />} variant="outline">
          {t("backToInventory")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: societies }, { data: blocks }] = await Promise.all([
    supabase.from("societies").select("id, code, name").order("name"),
    supabase.from("society_blocks").select("id, name, society_id").order("name"),
  ]);

  if (!societies?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("addTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("needSociety")}
        </p>
        <Button render={<Link href="/societies" />}>{t("goToSocieties")}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
          <PropertyForm
            societies={societies}
            blocks={blocks ?? []}
            role={profile.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}
