import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, CheckCircle, CreditCard, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts, canManageParties } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { ContractDepth } from "@/components/features/contract-depth";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string; contractId: string }>;
}) {
  const { id, contractId } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("pages.contracts");
  const tType = await getTranslations("labels.contractType");
  const tStatus = await getTranslations("labels.contractStatus");
  const tParties = await getTranslations("pages.parties");

  const { data: contract } = await supabase
    .from("contracts")
    .select("*, parties(id, name, code), societies(name)")
    .eq("id", contractId)
    .eq("party_id", id)
    .maybeSingle();

  if (!contract) {
    notFound();
  }

  const [{ data: measurements }, { data: materials }] = await Promise.all([
    supabase
      .from("measurement_entries")
      .select("*")
      .eq("contract_id", contractId)
      .order("entry_date", { ascending: false }),
    supabase
      .from("material_items")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false }),
  ]);

  const party = Array.isArray(contract.parties) ? contract.parties[0] : contract.parties;
  const society = Array.isArray(contract.societies) ? contract.societies[0] : contract.societies;
  const canManage = canManageParties(profile.role);
  const remaining = Number(contract.remaining_amount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/parties/${id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {t("backToParty", { name: party?.name ?? tParties("title") })}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-xs font-semibold text-primary">{contract.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {contract.title}
            </h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {tType(contract.contract_type)}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {tStatus(contract.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {society?.name ? `${society.name} · ` : ""}
            {t("started", { date: formatDate(contract.start_date ?? contract.created_at, locale) })}
          </p>
        </div>

        {canManageAccounts(profile.role) && remaining > 0 ? (
          <Button render={<Link href={`/parties/${id}/pay?contract=${contractId}`} />}>
            <CreditCard className="size-4" />
            {t("payContract")}
          </Button>
        ) : null}
      </div>

      {/* Financial summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t("agreedValue")}
          value={formatPkr(contract.contract_value, locale)}
          hint={t("woValueHint")}
          icon={Briefcase}
          variant="primary"
        />
        <StatCard
          title={t("paidToDate")}
          value={formatPkr(contract.paid_amount, locale)}
          hint={t("disbursedHint")}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title={t("remainingPayable")}
          value={formatPkr(remaining, locale)}
          hint={remaining > 0 ? t("outstandingBalance") : t("fullySettled")}
          icon={Wallet}
          variant={remaining > 0 ? "warning" : "default"}
        />
      </div>

      <ContractDepth
        contractId={contractId}
        canManage={canManage}
        measurements={measurements ?? []}
        materials={materials ?? []}
      />
    </div>
  );
}
