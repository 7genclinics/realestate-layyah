import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { CustomerForm } from "@/components/features/customer-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewCustomerPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("customers");
  const tCommon = await getTranslations("common");

  if (!canManageCrm(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("addTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/customers" />} variant="outline">
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
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}
