import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { LandPaymentForm } from "@/components/features/land-payment-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PayLandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.landBank");
  const tCommon = await getTranslations("common");

  if (!canManageAccounts(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("payLand")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("payNoPermission")}
        </p>
        <Button render={<Link href={`/land-bank/${id}`} />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: parcel }, { data: accounts }] = await Promise.all([
    supabase
      .from("land_parcels")
      .select("id, code, title, remaining_amount, status")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("cash_accounts")
      .select("id, code, name, account_type")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!parcel) {
    notFound();
  }

  if (
    parcel.status !== "approved" &&
    parcel.status !== "partially_paid" &&
    parcel.status !== "fully_paid"
  ) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("payLand")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("approveFirst")}
        </p>
        <Button render={<Link href={`/land-bank/${id}`} />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  if (!accounts?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("payLand")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("needAccount")}
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          {t("cashBook")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("payCode", { code: parcel.code })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("payHint")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{parcel.title}</CardTitle>
          <CardDescription>{t("cannotExceed")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LandPaymentForm
            landParcelId={parcel.id}
            remainingAmount={Number(parcel.remaining_amount)}
            accounts={accounts}
          />
        </CardContent>
      </Card>
    </div>
  );
}
