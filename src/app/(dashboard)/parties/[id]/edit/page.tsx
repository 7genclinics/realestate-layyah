import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts, canManageParties } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { PartyForm } from "@/components/features/party-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditPartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
  const { id } = await params;
  const t = await getTranslations("pages.parties");
  const tCommon = await getTranslations("common");

  if (!canManageParties(profile.role)) {
    redirect(`/parties/${id}`);
  }

  const canEditBank = canManageAccounts(profile.role);
  const supabase = await createClient();

  const { data: party } = await supabase
    .from("parties")
    .select(
      "id, name, party_type, phone, phone_secondary, address, id_number, opening_balance, status, notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (!party) {
    notFound();
  }

  const { data: bank } = canEditBank
    ? await supabase
        .from("party_bank_details")
        .select("bank_name, account_title, account_no, iban")
        .eq("party_id", id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("editSubtitle", { name: party.name })}
          </p>
        </div>
        <Button render={<Link href={`/parties/${id}`} />} variant="outline">
          {tCommon("cancel")}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>
            {t("profileHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartyForm
            canEditBank={canEditBank}
            partyId={party.id}
            defaultValues={{
              name: party.name,
              party_type: party.party_type,
              phone: party.phone,
              phone_secondary: party.phone_secondary ?? "",
              address: party.address ?? "",
              id_number: party.id_number ?? "",
              opening_balance: Number(party.opening_balance ?? 0),
              status: party.status,
              notes: party.notes ?? "",
              bank_name: bank?.bank_name ?? "",
              account_title: bank?.account_title ?? "",
              account_no: bank?.account_no ?? "",
              iban: bank?.iban ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
