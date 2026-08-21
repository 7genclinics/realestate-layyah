import Link from "next/link";
import { format } from "date-fns";
import { Plus, ArrowRightLeft, TrendingUp, TrendingDown, Wallet, Landmark, BookOpen } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  computeAccountBalance,
  summarizeDay,
  sumBalancesByAccountType,
  transactionSignedAmount,
} from "@/lib/cash-book";
import { createClient } from "@/lib/server";
import { canManageAccounts } from "@/lib/permissions";
import {
  CASH_ACCOUNT_TYPE_LABELS,
  CASH_TRANSACTION_TYPE_LABELS,
} from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CashBookPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const selectedDate = params.date ?? format(new Date(), "yyyy-MM-dd");
  const supabase = await createClient();

  const [{ data: accounts }, { data: transactions }] = await Promise.all([
    supabase
      .from("cash_accounts")
      .select("id, code, name, account_type, opening_balance")
      .eq("is_active", true)
      .order("account_type")
      .order("name"),
    supabase
      .from("cash_transactions")
      .select(
        "id, code, transaction_date, transaction_type, transfer_side, amount, description, payment_mode, receipt_id, cash_account_id, status, cash_accounts(name, account_type), cash_categories(name, group_name), societies(id, name)",
      )
      .eq("status", "posted")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const accountRows = accounts ?? [];
  const transactionRows = (transactions ?? []).map((row) => {
    const account = Array.isArray(row.cash_accounts)
      ? row.cash_accounts[0]
      : row.cash_accounts;
    const category = Array.isArray(row.cash_categories)
      ? row.cash_categories[0]
      : row.cash_categories;
    const society = Array.isArray(row.societies) ? row.societies[0] : row.societies;

    return { ...row, account, category, society };
  });

  const daySummary = summarizeDay(
    selectedDate,
    transactionRows.map((row) => ({
      transaction_date: row.transaction_date,
      transaction_type: row.transaction_type,
      transfer_side: row.transfer_side,
      amount: Number(row.amount),
      status: row.status,
    })),
  );

  const { cashTotal, bankTotal } = sumBalancesByAccountType(
    accountRows,
    transactionRows.map((row) => ({
      cash_account_id: row.cash_account_id,
      transaction_type: row.transaction_type,
      transfer_side: row.transfer_side,
      amount: Number(row.amount),
      status: row.status,
    })),
  );

  const filteredRows = transactionRows.filter(
    (row) => row.transaction_date === selectedDate,
  );

  const accountBalances = accountRows.map((account) => ({
    ...account,
    balance: computeAccountBalance(
      account.opening_balance,
      transactionRows
        .filter((row) => row.cash_account_id === account.id)
        .map((row) => ({
          transaction_type: row.transaction_type,
          transfer_side: row.transfer_side,
          amount: Number(row.amount),
          status: row.status,
        })),
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Cash Book &amp; Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Daily income, expense vouchers, internal transfers, and live cash/bank balances.
          </p>
        </div>
        {canManageAccounts(profile.role) ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button render={<Link href="/cash-book/new?type=expense" />}>
              <Plus className="size-4" />
              New Expense
            </Button>
            <Button
              render={<Link href="/cash-book/new?type=income" />}
              variant="outline"
            >
              <Plus className="size-4" />
              New Income
            </Button>
            <Button
              render={<Link href="/cash-book/transfer" />}
              variant="outline"
            >
              <ArrowRightLeft className="size-4" />
              Transfer
            </Button>
          </div>
        ) : null}
      </div>

      {/* Date Selector */}
      <form className="flex flex-wrap items-end gap-3 p-4 rounded-[10px] border bg-card shadow-xs">
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="date">
            Select Ledger Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={selectedDate}
            className="mt-1 block h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="h-9">
          View Date Ledger
        </Button>
      </form>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Day Income"
          value={formatPkr(daySummary.income)}
          hint={`Receipts & incomes on ${formatDate(selectedDate)}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Day Expense"
          value={formatPkr(daySummary.expense)}
          hint={`Payments on ${formatDate(selectedDate)}`}
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          title="Net Day Cashflow"
          value={formatPkr(daySummary.net)}
          hint="Income minus expense today"
          icon={Wallet}
          variant={daySummary.net >= 0 ? "sky" : "warning"}
        />
        <StatCard
          title="Total Liquidity"
          value={formatPkr(cashTotal + bankTotal)}
          hint={`Cash: ${formatPkr(cashTotal)} · Bank: ${formatPkr(bankTotal)}`}
          icon={Landmark}
          variant="primary"
        />
      </div>

      {/* Account Balances Card */}
      <div className="rounded-[10px] border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h2 className="font-semibold text-sm">Account Balances &amp; Wallets</h2>
            <p className="text-xs text-muted-foreground">Opening balance plus posted transactions.</p>
          </div>
          <Button render={<Link href="/reports/cash-book" />} variant="outline" size="sm">
            Cash Book Report
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {accountBalances.map((account) => (
            <div key={account.id} className="rounded-[8px] border bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors">
              <p className="text-xs font-mono text-muted-foreground uppercase">
                {account.code} · {CASH_ACCOUNT_TYPE_LABELS[account.account_type]}
              </p>
              <p className="font-medium mt-0.5">{account.name}</p>
              <p className="text-lg font-bold font-heading text-primary mt-1">{formatPkr(account.balance)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">
              Ledger Transactions ({formatDate(selectedDate)})
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">{filteredRows.length} vouchers</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Category / Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length ? (
              filteredRows.map((row) => {
                const signed = transactionSignedAmount({
                  transaction_type: row.transaction_type,
                  transfer_side: row.transfer_side,
                  amount: Number(row.amount),
                  status: row.status,
                });

                return (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Link
                        href={`/cash-book/${row.id}`}
                        className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {row.code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(row.transaction_date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md">
                        {CASH_TRANSACTION_TYPE_LABELS[row.transaction_type]}
                        {row.transfer_side
                          ? ` ${row.transfer_side === "in" ? "in" : "out"}`
                          : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{row.account?.name ?? "—"}</TableCell>
                    <TableCell>
                      {row.receipt_id ? (
                        <Link href={`/receipts/${row.receipt_id}`} className="text-primary hover:underline underline-offset-4">
                          Linked Receipt #{row.receipt_id.substring(0, 8)} · {row.description}
                        </Link>
                      ) : (
                        <div>
                          <span>{row.category?.name ?? row.description}</span>
                          {row.society?.name && (
                            <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                              ({row.society.name})
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold tabular-nums ${
                        signed >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {signed >= 0 ? "+" : "−"}
                      {formatPkr(Math.abs(signed))}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No transactions posted on {formatDate(selectedDate)}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
