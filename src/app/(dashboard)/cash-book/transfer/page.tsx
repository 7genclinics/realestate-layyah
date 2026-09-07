import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { CashTransferForm } from "@/components/features/cash-transfer-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CashTransferPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.cashBook");
  const tCommon = await getTranslations("common");

  if (!canManageAccounts(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("transferTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("transferNoPermission")}
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("cash_accounts")
    .select("id, code, name, account_type")
    .eq("is_active", true)
    .order("name");

  if (!accounts || accounts.length < 2) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("transferTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("needTwoAccounts")}
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("transferCashBank")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("transferHint")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("transferDetails")}</CardTitle>
          <CardDescription>
            {t("transferPaired")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashTransferForm accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
