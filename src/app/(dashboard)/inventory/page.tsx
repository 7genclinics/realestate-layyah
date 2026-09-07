import Link from "next/link";
import { Plus, MapPin, Building, CheckCircle2, Clock, Ban } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/server";
import { requireProfile } from "@/lib/auth";
import { canManageInventory } from "@/lib/permissions";
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { PropertyStatus, PropertyType } from "@/lib/database.types";
import { formatNumber, formatPkr } from "@/lib/format";
import { deleteProperty } from "@/lib/actions/properties";
import { PropertyStatusBadge } from "@/components/features/property-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { RowActions } from "@/components/features/row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;
const selectClassName =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ society?: string; status?: string; type?: string; page?: string }>;
}) {
  const { profile } = await requireProfile();
  const filters = await searchParams;
  const page = Math.max(1, parseInt(filters.page ?? "1", 10));
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("pages.inventory");
  const tStatus = await getTranslations("labels.propertyStatus");
  const tType = await getTranslations("labels.propertyType");
  const tUnit = await getTranslations("labels.areaUnit");
  const tCommon = await getTranslations("common");

  const canEdit = canManageInventory(profile.role);

  let countQuery = supabase.from("properties").select("id", { count: "exact", head: true });
  let dataQuery = supabase
    .from("properties")
    .select(
      "id, code, plot_no, property_type, status, area, area_unit, asking_price, agent_visible, society_id, societies(name, code), society_blocks(name)",
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filters.society) {
    countQuery = countQuery.eq("society_id", filters.society);
    dataQuery = dataQuery.eq("society_id", filters.society);
  }
  if (filters.status) {
    countQuery = countQuery.eq("status", filters.status as PropertyStatus);
    dataQuery = dataQuery.eq("status", filters.status as PropertyStatus);
  }
  if (filters.type) {
    countQuery = countQuery.eq("property_type", filters.type as PropertyType);
    dataQuery = dataQuery.eq("property_type", filters.type as PropertyType);
  }

  const [{ data: societies }, { count }, { data: properties, error }, { data: allProps }] = await Promise.all([
    supabase.from("societies").select("id, code, name").order("name"),
    countQuery,
    dataQuery,
    supabase.from("properties").select("status, asking_price"),
  ]);

  const totalCount = count ?? 0;
  const availableCount = (allProps ?? []).filter((p) => p.status === "available").length;
  const bookedCount = (allProps ?? []).filter((p) => p.status === "booked" || p.status === "sold").length;
  const holdCount = (allProps ?? []).filter((p) => p.status === "hold").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {canEdit ? (
          <Button render={<Link href="/inventory/new" />}>
            <Plus className="size-4" />
            {t("addUnit")}
          </Button>
        ) : null}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalUnits")}
          value={totalCount}
          hint={t("totalHint")}
          icon={Building}
          variant="sky"
        />
        <StatCard
          title={t("available")}
          value={availableCount}
          hint={t("availableHint")}
          icon={CheckCircle2}
          variant="success"
          href="/inventory?status=available"
        />
        <StatCard
          title={t("bookedSold")}
          value={bookedCount}
          hint={t("bookedHint")}
          icon={Clock}
          variant="primary"
          href="/inventory?status=booked"
        />
        <StatCard
          title={t("onHold")}
          value={holdCount}
          hint={t("holdHint")}
          icon={Ban}
          variant="warning"
          href="/inventory?status=hold"
        />
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-[10px] border bg-card shadow-xs p-4">
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">{t("filterSociety")}</span>
          <select name="society" defaultValue={filters.society ?? ""} className={selectClassName}>
            <option value="">{t("allSocieties")}</option>
            {(societies ?? []).map((society) => (
              <option key={society.id} value={society.id}>
                {society.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">{t("unitStatus")}</span>
          <select name="status" defaultValue={filters.status ?? ""} className={selectClassName}>
            <option value="">{t("allStatuses")}</option>
            {Object.keys(PROPERTY_STATUS_LABELS).map((value) => (
              <option key={value} value={value}>
                {tStatus(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">{t("propertyType")}</span>
          <select name="type" defaultValue={filters.type ?? ""} className={selectClassName}>
            <option value="">{t("allTypes")}</option>
            {Object.keys(PROPERTY_TYPE_LABELS).map((value) => (
              <option key={value} value={value}>
                {tType(value)}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="outline" size="sm" className="h-9">
          {t("filterInventory")}
        </Button>
      </form>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("masterList")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("unitsCount", { count: totalCount })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("code")}</TableHead>
              <TableHead>{t("plotShop")}</TableHead>
              <TableHead>{t("societyBlock")}</TableHead>
              <TableHead>{t("propertyType")}</TableHead>
              <TableHead>{t("area")}</TableHead>
              <TableHead>{t("askingPrice")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              {canEdit && <TableHead className="text-right">{tCommon("actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} className="py-10 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : properties?.length ? (
              properties.map((property) => {
                const society = Array.isArray(property.societies)
                  ? property.societies[0]
                  : property.societies;
                const block = Array.isArray(property.society_blocks)
                  ? property.society_blocks[0]
                  : property.society_blocks;

                return (
                  <TableRow key={property.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold">
                      <Link
                        href={`/inventory/${property.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {property.code}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      <Link
                        href={`/inventory/${property.id}`}
                        className="hover:underline underline-offset-4"
                      >
                        {property.plot_no}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href="/societies" className="hover:underline underline-offset-4 text-foreground font-medium">
                        {society?.name ?? tCommon("dash")}
                      </Link>
                      {block?.name ? <span className="text-xs text-muted-foreground ml-1 font-normal">· {block.name}</span> : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tType(property.property_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(property.area, locale)} {tUnit(property.area_unit)}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatPkr(property.asking_price, locale)}</TableCell>
                    <TableCell>
                      <PropertyStatusBadge status={property.status} />
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <RowActions
                          id={property.id}
                          viewHref={`/inventory/${property.id}`}
                          editHref={`/inventory/${property.id}/edit`}
                          deleteAction={deleteProperty}
                          confirmMessage={t("deleteConfirm", { plot: property.plot_no })}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 8 : 7}
                  className="py-10 text-center text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          total={count ?? 0}
          pageSize={PAGE_SIZE}
          params={{ society: filters.society, status: filters.status, type: filters.type }}
        />
      </div>
    </div>
  );
}
