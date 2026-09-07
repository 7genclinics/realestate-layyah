import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageParties } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { ContractForm } from "@/components/features/contract-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const t = await getTranslations("pages.parties");
  const tCommon = await getTranslations("common");

  if (!canManageParties(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newWorkOrder")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("woNoPermission")}
        </p>
        <Button render={<Link href={`/parties/${id}`} />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: parties }, { data: societies }] = await Promise.all([
    supabase.from("parties").select("id, code, name").eq("status", "active").order("name"),
    supabase.from("societies").select("id, code, name").order("name"),
  ]);

  if (!parties?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("newWorkOrder")}</h1>
        <p className="text-sm text-muted-foreground">{t("addPartyFirst")}</p>
        <Button render={<Link href="/parties/new" />}>{t("addParty")}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("newWorkOrder")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("woSubtitle")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("woDetails")}</CardTitle>
          <CardDescription>
            {t("woHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractForm
            parties={parties}
            societies={societies ?? []}
            defaultPartyId={id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
