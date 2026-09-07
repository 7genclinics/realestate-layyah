import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { CashVoucherForm } from "@/components/features/cash-voucher-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewCashVoucherPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const defaultType = params.type === "income" ? "income" : "expense";
  const t = await getTranslations("pages.cashBook");
  const tCommon = await getTranslations("common");

  if (!canManageAccounts(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newVoucher")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: accounts }, { data: categories }, { data: societies }] =
    await Promise.all([
      supabase
        .from("cash_accounts")
        .select("id, code, name, account_type")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("cash_categories")
        .select("id, name, group_name, category_type")
        .eq("is_active", true)
        .order("category_type")
        .order("group_name")
        .order("name"),
      supabase.from("societies").select("id, code, name").order("name"),
    ]);

  if (!accounts?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newVoucher")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("needAccount")}
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {defaultType === "income" ? t("newIncomeTitle") : t("newExpenseTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("voucherHint")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("voucherDetails")}</CardTitle>
          <CardDescription>
            {t("voucherAuto")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashVoucherForm
            accounts={accounts}
            categories={categories ?? []}
            societies={societies ?? []}
            defaultType={defaultType}
          />
        </CardContent>
      </Card>
    </div>
  );
}
