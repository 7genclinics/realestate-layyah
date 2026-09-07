import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import type { PropertyStatus } from "@/lib/database.types";
import { ReportHeader, ReportTotals } from "@/components/features/report-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUSES: PropertyStatus[] = [
  "available",
  "hold",
  "booked",
  "sold",
  "rented",
  "transferred",
  "blocked",
];

export default async function InventoryReportPage() {
  await requireProfile();
  const supabase = await createClient();
  const t = await getTranslations("reports");
  const tStatus = await getTranslations("labels.propertyStatus");
  const tType = await getTranslations("labels.propertyType");
  const tCommon = await getTranslations("common");
  const { data: properties } = await supabase
    .from("properties")
    .select("id, status, property_type, area, societies(name, code)")
    .is("deleted_at", null);

  const rows = (properties ?? []).map((row) => ({
    ...row,
    society: Array.isArray(row.societies) ? row.societies[0] : row.societies,
  }));

  const grouped = new Map<
    string,
    { society: string; status: PropertyStatus; type: string; count: number; area: number }
  >();

  for (const row of rows) {
    const key = `${row.society?.name ?? t("unassigned")}|${row.status}|${row.property_type}`;
    const current = grouped.get(key) ?? {
      society: row.society?.name ?? t("unassigned"),
      status: row.status,
      type: row.property_type,
      count: 0,
      area: 0,
    };
    grouped.set(key, {
      ...current,
      count: current.count + 1,
      area: current.area + Number(row.area),
    });
  }

  const tableRows = [...grouped.values()].sort((a, b) =>
    a.society.localeCompare(b.society),
  );

  const statusCounts = Object.fromEntries(
    STATUSES.map((status) => [status, rows.filter((row) => row.status === status).length]),
  ) as Record<PropertyStatus, number>;

  return (
    <div className="space-y-6">
      <ReportHeader
        title={t("inventoryAvailability")}
        description={t("inventoryAvailabilityDesc")}
        filename="inventory-availability"
        headers={[tCommon("society"), tCommon("status"), tCommon("type"), t("units"), t("totalArea")]}
        rows={tableRows.map((row) => [
          row.society,
          tStatus(row.status),
          tType(row.type),
          row.count,
          row.area,
        ])}
      />
      <ReportTotals
        items={STATUSES.slice(0, 4).map((status) => ({
          label: tStatus(status),
          value: String(statusCounts[status]),
        }))}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("society")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead>{tCommon("type")}</TableHead>
              <TableHead>{t("units")}</TableHead>
              <TableHead>{t("area")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.length ? (
              tableRows.map((row) => (
                <TableRow key={`${row.society}-${row.status}-${row.type}`}>
                  <TableCell>
                    <Link
                      href={`/inventory?status=${row.status}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.society}
                    </Link>
                  </TableCell>
                  <TableCell>{tStatus(row.status)}</TableCell>
                  <TableCell>
                    {tType(row.type)}
                  </TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{row.area}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("noInventory")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
