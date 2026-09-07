import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, Landmark, ArrowRightLeft, Briefcase, Hammer } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import {
  canApproveCommissions,
  canApproveExpenses,
  canApproveLand,
} from "@/lib/permissions";
import { approveLandParcel, approveLandExchange } from "@/lib/actions/land-bank";
import { approveCommission, rejectCommission } from "@/lib/actions/agents";
import { approveExpense, rejectExpense } from "@/lib/actions/development";
import { formatPkr } from "@/lib/format";
import { getLocale, getTranslations } from "next-intl/server";
import { StatCard } from "@/components/ui/stat-card";
import { ApprovalButtons } from "@/components/features/approval-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export default async function ApprovalsPage() {
  const { profile } = await requireProfile();
  const locale = await getLocale();
  const t = await getTranslations("approvals");
  const tCommon = await getTranslations("common");

  const canLand = canApproveLand(profile.role);
  const canCommission = canApproveCommissions(profile.role);
  const canExpense = canApproveExpenses(profile.role);

  if (!canLand && !canCommission && !canExpense) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const [
    { data: parcels },
    { data: exchanges },
    { data: commissions },
    { data: expenses },
  ] = await Promise.all([
    canLand
      ? supabase
          .from("land_parcels")
          .select("id, code, title, purchase_value, status, societies(name)")
          .in("status", ["proposed", "under_negotiation"])
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    canLand
      ? supabase
          .from("land_exchanges")
          .select("id, code, incoming_title, incoming_value, status, societies(name)")
          .in("status", ["draft", "pending_approval"])
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    canCommission
      ? supabase
          .from("agent_commissions")
          .select("id, commission_amount, status, agents(name), sales(plot_no)")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    canExpense
      ? supabase
          .from("development_expenses")
          .select("id, amount, description, status, development_projects(name)")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const parcelRows = parcels ?? [];
  const exchangeRows = exchanges ?? [];
  const commissionRows = commissions ?? [];
  const expenseRows = expenses ?? [];
  const totalPending =
    parcelRows.length + exchangeRows.length + commissionRows.length + expenseRows.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={t("landAcquisitions")} value={parcelRows.length} icon={Landmark} variant="sky" />
        <StatCard title={t("landExchanges")} value={exchangeRows.length} icon={ArrowRightLeft} variant="primary" />
        <StatCard title={t("agentCommissions")} value={commissionRows.length} icon={Briefcase} variant="warning" />
        <StatCard title={t("developmentExpenses")} value={expenseRows.length} icon={Hammer} variant="indigo" />
      </div>

      {totalPending === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <ClipboardCheck className="size-10 text-muted-foreground/50" />
            <p className="font-medium">{t("allCaughtUp")}</p>
            <p className="text-sm text-muted-foreground">
              {t("nothingWaiting")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {canLand && parcelRows.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="size-4 text-primary" /> {t("landAcquisitions")}
            </CardTitle>
            <CardDescription>{t("approveParcels")}</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {parcelRows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/land-bank/${row.id}`} className="font-medium text-primary hover:underline">
                    {row.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {one(row.societies)?.name ?? tCommon("dash")} · {formatPkr(Number(row.purchase_value), locale)}
                  </p>
                </div>
                <ApprovalButtons id={row.id} approveAction={approveLandParcel} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {canLand && exchangeRows.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="size-4 text-primary" /> {t("landExchanges")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {exchangeRows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/land-bank/exchanges/${row.id}`} className="font-medium text-primary hover:underline">
                    {row.incoming_title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {one(row.societies)?.name ?? tCommon("dash")} · {t("incoming", { amount: formatPkr(Number(row.incoming_value), locale) })}
                  </p>
                </div>
                <ApprovalButtons id={row.id} approveAction={approveLandExchange} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {canCommission && commissionRows.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="size-4 text-primary" /> {t("agentCommissions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {commissionRows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <span className="font-medium">{one(row.agents)?.name ?? t("agentFallback")}</span>
                  <p className="text-xs text-muted-foreground">
                    {t("plotLine", {
                      plot: one(row.sales)?.plot_no ?? tCommon("dash"),
                      amount: formatPkr(Number(row.commission_amount), locale),
                    })}
                  </p>
                </div>
                <ApprovalButtons
                  id={row.id}
                  approveAction={approveCommission}
                  rejectAction={rejectCommission}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {canExpense && expenseRows.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Hammer className="size-4 text-primary" /> {t("developmentExpenses")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {expenseRows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <span className="font-medium">{row.description}</span>
                  <p className="text-xs text-muted-foreground">
                    {one(row.development_projects)?.name ?? tCommon("dash")} · {formatPkr(Number(row.amount), locale)}
                  </p>
                </div>
                <ApprovalButtons
                  id={row.id}
                  approveAction={approveExpense}
                  rejectAction={rejectExpense}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
