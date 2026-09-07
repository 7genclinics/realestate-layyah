import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { ReceivePaymentForm } from "@/components/features/receive-payment-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ sale?: string; installment?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const t = await getTranslations("pages.receipts");
  const tCommon = await getTranslations("common");

  if (!canManageCrm(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noPermission")}
        </p>
        <Button render={<Link href="/receipts" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: sales }, { data: installments }, { data: accounts }] =
    await Promise.all([
      supabase
        .from("sales")
        .select(
          "id, code, plot_no, remaining_amount, customer_id, customers(full_name, code)",
        )
        .neq("status", "cancelled")
        .gt("remaining_amount", 0)
        .order("created_at", { ascending: false }),
      supabase
        .from("installments")
        .select(
          "id, sale_id, installment_no, period_label, scheduled_amount, received_amount",
        )
        .order("installment_no"),
      supabase
        .from("cash_accounts")
        .select("id, code, name, account_type")
        .eq("is_active", true)
        .order("account_type")
        .order("name"),
    ]);

  if (!sales?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noOpenSales")}
        </p>
        <Button render={<Link href="/bookings/new" />}>{t("newBooking")}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("newSubtitle")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("paymentDetails")}</CardTitle>
          <CardDescription>
            {t("paymentHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceivePaymentForm
            sales={sales}
            installments={installments ?? []}
            accounts={accounts ?? []}
            defaultSaleId={params.sale}
            defaultInstallmentId={params.installment}
          />
        </CardContent>
      </Card>
    </div>
  );
}
