import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts, canManageParties } from "@/lib/permissions";
import { PartyForm } from "@/components/features/party-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewPartyPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.parties");
  const tCommon = await getTranslations("common");

  if (!canManageParties(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("addTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/parties" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

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
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>
            {t("profileHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartyForm canEditBank={canManageAccounts(profile.role)} />
        </CardContent>
      </Card>
    </div>
  );
}
