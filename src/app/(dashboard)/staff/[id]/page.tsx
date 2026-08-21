import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle,
  Coins,
  DollarSign,
  Landmark,
  Plus,
  Receipt,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { getStaffById } from "@/lib/staff";
import { createClient } from "@/lib/server";
import { recordSalaryAdvance } from "@/lib/actions/staff";
import { formatPkr, formatDate } from "@/lib/format";
import { STAFF_DEPARTMENT_LABELS, STAFF_STATUS_LABELS, PAYROLL_STATUS_LABELS } from "@/lib/constants";
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

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getStaffById(id);

  if (!staff) {
    notFound();
  }

  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("cash_accounts")
    .select("id, name, account_type")
    .eq("is_active", true);

  const activeAdvanceTotal = (staff.advances || [])
    .filter((a: any) => a.status === "active")
    .reduce((sum: number, a: any) => sum + (Number(a.amount) - Number(a.repaid_amount || 0)), 0);

  const totalPayrollPaid = (staff.payroll || [])
    .filter((p: any) => p.payment_status === "paid")
    .reduce((sum: number, p: any) => sum + Number(p.net_salary || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/staff"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Staff
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-mono">
              {STAFF_DEPARTMENT_LABELS[staff.department as keyof typeof STAFF_DEPARTMENT_LABELS] ?? staff.department}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{staff.full_name}</h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {staff.designation}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {STAFF_STATUS_LABELS[staff.status as keyof typeof STAFF_STATUS_LABELS] ?? staff.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Department: {STAFF_DEPARTMENT_LABELS[staff.department as keyof typeof STAFF_DEPARTMENT_LABELS] ?? staff.department} · Phone: {staff.phone} · CNIC: {staff.cnic || "Not provided"} · Joining Date: {formatDate(staff.joining_date)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button render={<Link href="/staff/payroll" />} variant="outline">
            <CalendarClock className="size-4" />
            Process Monthly Payroll
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Basic Monthly Salary"
          value={formatPkr(staff.basic_salary)}
          hint="Contracted monthly salary"
          icon={Banknote}
          variant="primary"
        />
        <StatCard
          title="Outstanding Advances"
          value={formatPkr(activeAdvanceTotal)}
          hint="Deductible from upcoming payroll"
          icon={Coins}
          variant={activeAdvanceTotal > 0 ? "warning" : "default"}
          href="/cash-book"
        />
        <StatCard
          title="Total Net Salary Paid"
          value={formatPkr(totalPayrollPaid)}
          hint={`${(staff.payroll || []).length} monthly disbursements`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Employee Status"
          value={STAFF_STATUS_LABELS[staff.status as keyof typeof STAFF_STATUS_LABELS] ?? staff.status}
          hint={`Joined on ${formatDate(staff.joining_date)}`}
          icon={User}
          variant="sky"
        />
      </div>

      {/* Record Advance Form */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4 max-w-2xl">
        <div className="border-b pb-3">
          <h2 className="text-base font-semibold text-foreground">Disburse Salary Advance</h2>
          <p className="text-xs text-muted-foreground">Post salary advance voucher to be deducted from monthly payroll.</p>
        </div>
        <form action={recordSalaryAdvance} className="space-y-4">
          <input type="hidden" name="staff_id" value={staff.id} />
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Advance Amount (PKR) *
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              required
              placeholder="e.g. 15000"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Paid From Cash/Bank Account *
            </label>
            <select
              name="cash_account_id"
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Account</option>
              {(accounts || []).map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Notes &amp; Reason
            </label>
            <input
              type="text"
              name="notes"
              placeholder="e.g. Emergency advance for medical"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="submit">
            <Plus className="size-4" />
            Issue Salary Advance Voucher
          </Button>
        </form>
      </div>

      {/* Salary Advances History Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Salary Advances History</h2>
          </div>
          <span className="text-xs text-muted-foreground">{(staff.advances || []).length} advances issued</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Issued Amount</TableHead>
              <TableHead>Repaid Amount</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.advances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No salary advances issued to this employee.
                </TableCell>
              </TableRow>
            ) : (
              staff.advances.map((adv: any) => {
                const acc = Array.isArray(adv.cash_accounts) ? adv.cash_accounts[0] : adv.cash_accounts;
                const outstanding = Number(adv.amount) - Number(adv.repaid_amount || 0);
                return (
                  <TableRow key={adv.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(adv.issue_date)}</TableCell>
                    <TableCell className="font-medium">{acc?.name ?? "Cash Box"}</TableCell>
                    <TableCell className="font-semibold">{formatPkr(adv.amount)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">{formatPkr(adv.repaid_amount || 0)}</TableCell>
                    <TableCell className="font-bold text-amber-600 dark:text-amber-400">{formatPkr(outstanding)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{adv.notes || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={adv.status === "active" ? "secondary" : "outline"} className="rounded-md">
                        {adv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Monthly Payroll History Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Monthly Payroll Disbursement History</h2>
          </div>
          <span className="text-xs text-muted-foreground">{(staff.payroll || []).length} payroll records</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period Month</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Advance Deduction</TableHead>
              <TableHead>Other Deductions</TableHead>
              <TableHead>Bonus / Additions</TableHead>
              <TableHead>Net Salary Paid</TableHead>
              <TableHead>Disbursed At</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.payroll.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No payroll history recorded for this employee yet.
                </TableCell>
              </TableRow>
            ) : (
              staff.payroll.map((pay: any) => (
                <TableRow key={pay.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold font-mono text-xs text-primary">{pay.period_month}</TableCell>
                  <TableCell className="font-medium">{formatPkr(pay.basic_salary)}</TableCell>
                  <TableCell className="text-amber-600 dark:text-amber-400 font-medium">{formatPkr(pay.advance_deduction || 0)}</TableCell>
                  <TableCell className="text-rose-600 dark:text-rose-400 font-medium">{formatPkr(pay.other_deduction || 0)}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">{formatPkr(pay.bonus || 0)}</TableCell>
                  <TableCell className="font-bold text-foreground">{formatPkr(pay.net_salary)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{pay.paid_at ? formatDate(pay.paid_at) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={pay.payment_status === "paid" ? "secondary" : "outline"} className="rounded-md">
                      {PAYROLL_STATUS_LABELS[pay.payment_status as keyof typeof PAYROLL_STATUS_LABELS] ?? pay.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
