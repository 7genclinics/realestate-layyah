import Link from "next/link";
import { Plus, Users, UserCheck, UserPlus, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { CUSTOMER_STAGE_LABELS } from "@/lib/constants";
import { deleteCustomer } from "@/lib/actions/customers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { RowActions } from "@/components/features/row-actions";
import { CustomerImportDialog } from "@/components/features/customer-import-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { profile } = await requireProfile();
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const supabase = await createClient();
  const t = await getTranslations("customers");
  const tStage = await getTranslations("labels.customerStage");
  const tCommon = await getTranslations("common");

  let baseQuery = supabase
    .from("customers")
    .select("id, code, full_name, phone, id_number, stage, source");

  if (q?.trim()) {
    const term = q.trim();
    baseQuery = baseQuery.or(
      `full_name.ilike.%${term}%,phone.ilike.%${term}%,code.ilike.%${term}%,id_number.ilike.%${term}%`,
    );
  }

  const [{ count }, { data: customers, error }, { data: allCustomers }] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .then((r) => {
        if (q?.trim()) {
          const term = q.trim();
          return supabase
            .from("customers")
            .select("id", { count: "exact", head: true })
            .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,code.ilike.%${term}%,id_number.ilike.%${term}%`);
        }
        return r;
      }),
    baseQuery
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.from("customers").select("stage"),
  ]);

  const canEdit = canManageCrm(profile.role);
  const totalCount = count ?? 0;
  const bookedCount = (allCustomers ?? []).filter((c) => c.stage === "booked" || c.stage === "active_emi" || c.stage === "fully_paid").length;
  const leadCount = (allCustomers ?? []).filter((c) => c.stage === "lead" || c.stage === "negotiation").length;

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
            <CustomerImportDialog />
            <Button render={<Link href="/customers/new" />}>
              <Plus className="size-4" />
              {t("addCustomer")}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t("total")}
          value={totalCount}
          hint={t("registeredHint")}
          icon={Users}
          variant="sky"
        />
        <StatCard
          title={t("activeBuyers")}
          value={bookedCount}
          hint={t("activeBuyersHint")}
          icon={UserCheck}
          variant="primary"
          href="/installments"
        />
        <StatCard
          title={t("activeLeads")}
          value={leadCount}
          hint={t("activeLeadsHint")}
          icon={UserPlus}
          variant="warning"
        />
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholderLong")}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          {tCommon("search")}
        </Button>
      </form>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("masterList")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("customersCount", { count: totalCount })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("customerCode")}</TableHead>
              <TableHead>{t("fullName")}</TableHead>
              <TableHead>{t("phoneNumber")}</TableHead>
              <TableHead>{t("cnic")}</TableHead>
              <TableHead>{t("stage")}</TableHead>
              {canEdit && <TableHead className="text-right">{tCommon("actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="py-10 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : customers?.length ? (
              customers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {customer.code}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="hover:underline underline-offset-4"
                    >
                      {customer.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.id_number || tCommon("dash")}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-md font-normal">
                      {tStage(customer.stage as keyof typeof CUSTOMER_STAGE_LABELS)}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <RowActions
                        id={customer.id}
                        viewHref={`/customers/${customer.id}`}
                        editHref={`/customers/${customer.id}/edit`}
                        deleteAction={deleteCustomer}
                        confirmMessage={t("deleteConfirm", { name: customer.full_name })}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 6 : 5}
                  className="py-10 text-center text-muted-foreground"
                >
                  {t("empty")}
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
