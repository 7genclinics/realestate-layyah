import Link from "next/link";
import { Plus, ArrowRightLeft, LandPlot, Wallet, Building2, MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageLandBank } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  AREA_UNIT_LABELS,
  LAND_ACQUISITION_LABELS,
  LAND_EXCHANGE_STATUS_LABELS,
  LAND_STATUS_LABELS,
} from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import { deleteLandParcel } from "@/lib/actions/land-bank";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { RowActions } from "@/components/features/row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LandBankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { profile } = await requireProfile();
  const { q } = await searchParams;
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("pages.landBank");
  const tAcq = await getTranslations("labels.landAcquisition");
  const tStatus = await getTranslations("labels.landStatus");
  const tUnit = await getTranslations("labels.areaUnit");
  const tEx = await getTranslations("labels.landExchangeStatus");
  const tCommon = await getTranslations("common");

  let parcelsQuery = supabase
    .from("land_parcels")
    .select(
      "id, code, title, area, area_unit, purchase_value, remaining_amount, status, acquisition_type, parties(id, name), societies(id, name)",
    )
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    const term = q.trim();
    parcelsQuery = parcelsQuery.or(
      `title.ilike.%${term}%,code.ilike.%${term}%,khasra.ilike.%${term}%,location.ilike.%${term}%`,
    );
  }

  const [{ data: parcels }, { data: exchanges }] = await Promise.all([
    parcelsQuery,
    supabase
      .from("land_exchanges")
      .select(
        "id, code, incoming_title, outgoing_value, incoming_value, difference_amount, status, parties(id, name)",
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const rows = (parcels ?? []).map((row) => ({
    ...row,
    party: Array.isArray(row.parties) ? row.parties[0] : row.parties,
    society: Array.isArray(row.societies) ? row.societies[0] : row.societies,
  }));

  const totalLandValue = rows.reduce((sum, row) => sum + Number(row.purchase_value || 0), 0);
  const payable = rows
    .filter((row) => row.status !== "transferred")
    .reduce((sum, row) => sum + Number(row.remaining_amount || 0), 0);

  const canEdit = canManageLandBank(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <Button render={<Link href="/land-bank/exchanges/new" />} variant="outline">
              <ArrowRightLeft className="size-4" />
              {t("newExchange")}
            </Button>
            <Button render={<Link href="/land-bank/new" />}>
              <Plus className="size-4" />
              {t("addParcel")}
            </Button>
          </div>
        ) : null}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t("totalParcels")}
          value={rows.length}
          hint={t("fullyPaidHint", { count: rows.filter((r) => r.status === "fully_paid").length })}
          icon={LandPlot}
          variant="sky"
        />
        <StatCard
          title={t("acquisitionValue")}
          value={formatPkr(totalLandValue, locale)}
          hint={t("acquisitionHint")}
          icon={Building2}
          variant="primary"
        />
        <StatCard
          title={t("landlordPayable")}
          value={formatPkr(payable, locale)}
          hint={t("payableHint")}
          icon={Wallet}
          variant="warning"
          href="/parties"
        />
      </div>

      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="max-w-sm" />
        <Button type="submit" variant="outline">
          {tCommon("search")}
        </Button>
      </form>

      {/* Land Parcels Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("parcelsDirectory")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("parcelsCount", { count: rows.length })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("landTitle")}</TableHead>
              <TableHead>{tCommon("society")}</TableHead>
              <TableHead>{t("landlordParty")}</TableHead>
              <TableHead>{t("area")}</TableHead>
              <TableHead>{t("totalValue")}</TableHead>
              <TableHead>{t("remainingPayable")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              {canEdit && <TableHead className="text-right">{tCommon("actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Link
                      href={`/land-bank/${row.id}`}
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {row.title}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {row.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.society?.id ? (
                      <Link href="/societies" className="hover:underline underline-offset-4 text-foreground">
                        {row.society.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {row.party?.id ? (
                      <Link href={`/parties/${row.party.id}`} className="text-primary hover:underline underline-offset-4">
                        {row.party.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {tAcq(row.acquisition_type)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.area} {tUnit(row.area_unit)}
                  </TableCell>
                  <TableCell className="font-semibold">{formatPkr(row.purchase_value, locale)}</TableCell>
                  <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                    {formatPkr(row.remaining_amount, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-md">
                      {tStatus(row.status)}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <RowActions
                        id={row.id}
                        viewHref={`/land-bank/${row.id}`}
                        editHref={`/land-bank/${row.id}/edit`}
                        deleteAction={deleteLandParcel}
                        confirmMessage={t("deleteParcel", { title: row.title })}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} className="py-10 text-center text-muted-foreground">
                  {t("emptyParcels")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Exchange Deals Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs space-y-0">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("exchangesHeading")}</h2>
          </div>
          <Button render={<Link href="/reports/land-bank" />} variant="outline" size="sm">
            {t("landReport")}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dealCode")}</TableHead>
              <TableHead>{t("incomingLand")}</TableHead>
              <TableHead>{t("landlordParty")}</TableHead>
              <TableHead>{t("incomingValue")}</TableHead>
              <TableHead>{t("outgoingValue")}</TableHead>
              <TableHead>{t("netDifference")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(exchanges ?? []).length ? (
              (exchanges ?? []).map((row) => {
                const party = Array.isArray(row.parties) ? row.parties[0] : row.parties;
                return (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Link
                        href={`/land-bank/exchanges/${row.id}`}
                        className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {row.code}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{row.incoming_title}</TableCell>
                    <TableCell>
                      {party?.id ? (
                        <Link href={`/parties/${party.id}`} className="text-primary hover:underline underline-offset-4">
                          {party.name}
                        </Link>
                      ) : (
                        party?.name ?? "—"
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{formatPkr(row.incoming_value, locale)}</TableCell>
                    <TableCell className="font-medium text-muted-foreground">{formatPkr(row.outgoing_value, locale)}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatPkr(row.difference_amount, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md">
                        {tEx(row.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("emptyExchanges")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
