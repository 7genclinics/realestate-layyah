import Link from "next/link";
import { Plus, Handshake, Landmark, Briefcase, Wallet } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { canManageParties } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { PARTY_STATUS_LABELS, PARTY_TYPE_LABELS } from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import { deleteParty } from "@/lib/actions/parties";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default async function PartiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { profile } = await requireProfile();
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const supabase = await createClient();

  let baseQuery = supabase
    .from("parties")
    .select("id, code, name, phone, party_type, status, opening_balance");

  if (q?.trim()) {
    const term = q.trim();
    baseQuery = baseQuery.or(
      `name.ilike.%${term}%,phone.ilike.%${term}%,code.ilike.%${term}%`,
    );
  }

  const [{ count }, { data: parties, error }, { data: allParties }] = await Promise.all([
    (() => {
      let cq = supabase.from("parties").select("id", { count: "exact", head: true });
      if (q?.trim()) {
        const term = q.trim();
        cq = cq.or(`name.ilike.%${term}%,phone.ilike.%${term}%,code.ilike.%${term}%`);
      }
      return cq;
    })(),
    baseQuery
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.from("parties").select("id, party_type, opening_balance"),
  ]);

  const partyIds = (parties ?? []).map((row) => row.id);

  const { data: contracts } = partyIds.length
    ? await supabase
        .from("contracts")
        .select("party_id, contract_value, remaining_amount, status")
        .in("party_id", partyIds)
    : { data: [] };

  const totals = new Map<string, { value: number; remaining: number }>();
  for (const row of contracts ?? []) {
    if (row.status === "cancelled") continue;
    const current = totals.get(row.party_id) ?? { value: 0, remaining: 0 };
    totals.set(row.party_id, {
      value: current.value + Number(row.contract_value),
      remaining: current.remaining + Number(row.remaining_amount),
    });
  }

  const totalPartiesCount = count ?? 0;
  const contractorsCount = (allParties ?? []).filter((p) => p.party_type === "contractor" || p.party_type === "subcontractor").length;
  const landlordsCount = (allParties ?? []).filter((p) => p.party_type === "landlord").length;
  const suppliersCount = (allParties ?? []).filter((p) => p.party_type === "supplier").length;

  const canEdit = canManageParties(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Parties &amp; Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Landlords, civil contractors, materials suppliers, utilities, and work orders payable ledger.
          </p>
        </div>
        {canEdit ? (
          <Button render={<Link href="/parties/new" />}>
            <Plus className="size-4" />
            Add Party
          </Button>
        ) : null}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Registered Parties"
          value={totalPartiesCount}
          hint={`${contractorsCount} contractors & subcontractors`}
          icon={Handshake}
          variant="sky"
        />
        <StatCard
          title="Landlords"
          value={landlordsCount}
          hint="Land bank acquisition partners"
          icon={Landmark}
          variant="primary"
          href="/land-bank"
        />
        <StatCard
          title="Suppliers &amp; Vendors"
          value={suppliersCount}
          hint="Material & utility vendors"
          icon={Briefcase}
          variant="warning"
          href="/development"
        />
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, phone or ID code"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Handshake className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Parties &amp; Contractor Directory</h2>
          </div>
          <span className="text-xs text-muted-foreground">{totalPartiesCount} parties</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Party ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Party Type</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Total Payable</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} className="py-10 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : parties?.length ? (
              parties.map((party) => {
                const summary = totals.get(party.id);
                const payable = Number(party.opening_balance) + (summary?.remaining ?? 0);

                return (
                  <TableRow key={party.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/parties/${party.id}`}
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {party.code}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <Link
                        href={`/parties/${party.id}`}
                        className="hover:underline underline-offset-4 font-semibold"
                      >
                        {party.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {PARTY_TYPE_LABELS[party.party_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{party.phone}</TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">{formatPkr(payable)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md">
                        {PARTY_STATUS_LABELS[party.status]}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <RowActions
                          id={party.id}
                          viewHref={`/parties/${party.id}`}
                          editHref={`/parties/${party.id}`}
                          deleteAction={deleteParty}
                          confirmMessage={`Delete party "${party.name}"?`}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 7 : 6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No parties found. Click &quot;Add Party&quot; to register a landlord or vendor.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} params={{ q }} />
      </div>
    </div>
  );
}
