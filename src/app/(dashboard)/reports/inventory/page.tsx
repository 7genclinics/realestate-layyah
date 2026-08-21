import Link from "next/link";
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
    const key = `${row.society?.name ?? "Unassigned"}|${row.status}|${row.property_type}`;
    const current = grouped.get(key) ?? {
      society: row.society?.name ?? "Unassigned",
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
        title="Inventory availability"
        description="Units by society, listing status and property type."
        filename="inventory-availability"
        headers={["Society", "Status", "Type", "Units", "Total area"]}
        rows={tableRows.map((row) => [
          row.society,
          PROPERTY_STATUS_LABELS[row.status],
          PROPERTY_TYPE_LABELS[row.type as keyof typeof PROPERTY_TYPE_LABELS],
          row.count,
          row.area,
        ])}
      />
      <ReportTotals
        items={STATUSES.slice(0, 4).map((status) => ({
          label: PROPERTY_STATUS_LABELS[status],
          value: String(statusCounts[status]),
        }))}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Society</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Area</TableHead>
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
                  <TableCell>{PROPERTY_STATUS_LABELS[row.status]}</TableCell>
                  <TableCell>
                    {PROPERTY_TYPE_LABELS[row.type as keyof typeof PROPERTY_TYPE_LABELS]}
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
                  No inventory to report.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
