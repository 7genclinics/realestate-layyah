import Link from "next/link";
import { Plus, Receipt, DollarSign, CreditCard, Banknote, Printer } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { PAYMENT_MODE_LABELS } from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ReceiptsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select(
      "id, code, payment_date, amount, payment_mode, customer_id, customers(full_name, code), sales(id, code, plot_no)",
    )
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const list = receipts ?? [];
  const totalCollections = list.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const cashReceipts = list.filter((r) => r.payment_mode === "cash").reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const bankReceipts = totalCollections - cashReceipts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Receipts &amp; Payments</h1>
          <p className="text-sm text-muted-foreground">
            Customer payment receipts, installment recoveries, token collections and printable e-vouchers.
          </p>
        </div>
        {canManageCrm(profile.role) ? (
          <Button render={<Link href="/receipts/new" />}>
            <Plus className="size-4" />
            Receive Payment
          </Button>
        ) : null}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Collections"
          value={formatPkr(totalCollections)}
          hint={`${list.length} posted customer receipts`}
          icon={Receipt}
          variant="success"
        />
        <StatCard
          title="Cash Receipts"
          value={formatPkr(cashReceipts)}
          hint="Direct cash drawer receipts"
          icon={DollarSign}
          variant="sky"
          href="/cash-book"
        />
        <StatCard
          title="Bank / Online Receipts"
          value={formatPkr(bankReceipts)}
          hint="Bank transfers & cheque clearances"
          icon={CreditCard}
          variant="primary"
          href="/cash-book"
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Customer Receipt Log</h2>
          </div>
          <span className="text-xs text-muted-foreground">{list.length} receipts</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Sale / Plot No</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : list.length ? (
              list.map((receipt) => {
                const customer = Array.isArray(receipt.customers)
                  ? receipt.customers[0]
                  : receipt.customers;
                const sale = Array.isArray(receipt.sales)
                  ? receipt.sales[0]
                  : receipt.sales;

                return (
                  <TableRow key={receipt.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/receipts/${receipt.id}`}
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {receipt.code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(receipt.payment_date)}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {customer ? (
                        <Link
                          href={`/customers/${receipt.customer_id}`}
                          className="hover:underline underline-offset-4 font-semibold text-foreground"
                        >
                          {customer.full_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {sale ? (
                        <div>
                          <span className="font-medium">{sale.plot_no}</span>
                          <span className="ml-1.5 font-mono text-xs text-muted-foreground">({sale.code})</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {PAYMENT_MODE_LABELS[receipt.payment_mode]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(receipt.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-md"
                        render={<Link href={`/receipts/${receipt.id}`} />}
                      >
                        <Printer className="size-3 mr-1" />
                        Print
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No payment receipts recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
