import Link from "next/link";
import { Building2, MapPin, Layers, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/server";
import { SOCIETY_STATUS_LABELS } from "@/lib/constants";
import { deleteSociety } from "@/lib/actions/societies";
import { CreateSocietyDialog } from "@/components/features/create-society-dialog";
import { Badge } from "@/components/ui/badge";
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

export default async function SocietiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const supabase = await createClient();

  const [{ count }, { data: societies, error }, { data: allSocieties }, { count: totalPlots }] = await Promise.all([
    supabase.from("societies").select("id", { count: "exact", head: true }),
    supabase
      .from("societies")
      .select("id, code, name, location, status, currency, created_at")
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.from("societies").select("status"),
    supabase.from("properties").select("id", { count: "exact", head: true }),
  ]);

  const totalCount = count ?? 0;
  const activeCount = (allSocieties ?? []).filter((s) => s.status === "active").length;
  const planningCount = (allSocieties ?? []).filter((s) => s.status === "planning").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Societies &amp; Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Master society records, housing schemes, blocks, phases and operational project settings.
          </p>
        </div>
        <CreateSocietyDialog />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Housing Projects"
          value={totalCount}
          hint={`${totalPlots ?? 0} total plot inventory units`}
          icon={Building2}
          variant="sky"
          href="/inventory"
        />
        <StatCard
          title="Active Projects"
          value={activeCount}
          hint="Open for bookings & development"
          icon={CheckCircle2}
          variant="primary"
        />
        <StatCard
          title="Planning / Future Schemes"
          value={planningCount}
          hint="Under planning & land acquisition"
          icon={Layers}
          variant="warning"
          href="/land-bank"
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Societies Master Registry</h2>
          </div>
          <span className="text-xs text-muted-foreground">{totalCount} societies</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Code</TableHead>
              <TableHead>Society Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : societies?.length ? (
              societies.map((society) => (
                <TableRow key={society.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{society.code}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    <Link
                      href={`/inventory?society=${society.id}`}
                      className="hover:underline underline-offset-4 font-semibold"
                    >
                      {society.name}
                    </Link>
                  </TableCell>
                  <TableCell>{society.location || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-md font-normal">
                      {SOCIETY_STATUS_LABELS[society.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{society.currency}</TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      id={society.id}
                      viewHref={`/inventory?society=${society.id}`}
                      deleteAction={deleteSociety}
                      confirmMessage={`Delete society "${society.name}"? This will remove all associated blocks and data.`}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No societies yet. Click &quot;Add Society&quot; to begin inventory and sales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
