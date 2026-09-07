import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { PartyPaymentForm } from "@/components/features/party-payment-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PayPartyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ contract?: string }>;
}) {
  const { id } = await params;
  const { contract } = await searchParams;
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.parties");
  const tCommon = await getTranslations("common");

  if (!canManageAccounts(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("payParty")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("payNoPermission")}
        </p>
        <Button render={<Link href={`/parties/${id}`} />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: contracts }, { data: accounts }] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, code, title, remaining_amount")
      .eq("party_id", id)
      .neq("status", "cancelled")
      .gt("remaining_amount", 0)
      .order("created_at", { ascending: false }),
    supabase
      .from("cash_accounts")
      .select("id, code, name, account_type")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!contracts?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("payParty")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noOpenOrders")}
        </p>
        <Button render={<Link href={`/parties/${id}/contracts/new`} />}>
          {t("newWorkOrder")}
        </Button>
      </div>
    );
  }

  if (!accounts?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("payParty")}</h1>
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
        <h1 className="text-2xl font-semibold tracking-tight">{t("payParty")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("payPageSubtitle")}
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
          <PartyPaymentForm
            contracts={contracts}
            accounts={accounts}
            defaultContractId={contract}
          />
        </CardContent>
      </Card>
    </div>
  );
}
