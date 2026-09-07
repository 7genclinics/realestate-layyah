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
import { getLocale, getTranslations } from "next-intl/server";
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
  const locale = await getLocale();
  const t = await getTranslations("pages.staff");
  const tDept = await getTranslations("labels.staffDepartment");
  const tStatus = await getTranslations("labels.staffStatus");
  const tPay = await getTranslations("labels.payrollStatus");
  const tCommon = await getTranslations("common");

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
              {t("backToStaff")}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-mono">
              {tDept(staff.department)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{staff.full_name}</h1>
            <Badge variant="secondary" className="rounded-md font-normal">
              {staff.designation}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {tStatus(staff.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t("departmentLine", {
              dept: tDept(staff.department),
              phone: staff.phone,
              cnic: staff.cnic || t("notProvided"),
              date: formatDate(staff.joining_date, locale),
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button render={<Link href="/staff/payroll" />} variant="outline">
            <CalendarClock className="size-4" />
            {t("processPayroll")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("basicMonthlySalary")}
          value={formatPkr(staff.basic_salary, locale)}
          hint={t("contractedSalary")}
          icon={Banknote}
          variant="primary"
        />
        <StatCard
          title={t("outstandingAdvances")}
          value={formatPkr(activeAdvanceTotal, locale)}
          hint={t("deductibleHint")}
          icon={Coins}
          variant={activeAdvanceTotal > 0 ? "warning" : "default"}
          href="/cash-book"
        />
        <StatCard
          title={t("totalNetPaid")}
          value={formatPkr(totalPayrollPaid, locale)}
          hint={t("disbursements", { count: (staff.payroll || []).length })}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title={t("employeeStatus")}
          value={tStatus(staff.status)}
          hint={t("joinedOn", { date: formatDate(staff.joining_date, locale) })}
          icon={User}
          variant="sky"
        />
      </div>

      {/* Record Advance Form */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4 max-w-2xl">
        <div className="border-b pb-3">
          <h2 className="text-base font-semibold text-foreground">{t("disburseAdvance")}</h2>
          <p className="text-xs text-muted-foreground">{t("disburseAdvanceHint")}</p>
        </div>
        <form action={recordSalaryAdvance} className="space-y-4">
          <input type="hidden" name="staff_id" value={staff.id} />
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              {t("advanceAmount")}
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
              {t("paidFromAccountStar")}
            </label>
            <select
              name="cash_account_id"
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("selectAccount")}</option>
              {(accounts || []).map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              {t("notesReason")}
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
            {t("issueAdvance")}
          </Button>
        </form>
      </div>

      {/* Salary Advances History Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("advancesHistory")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("advancesCount", { count: (staff.advances || []).length })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("issueDate")}</TableHead>
              <TableHead>{t("account")}</TableHead>
              <TableHead>{t("issuedAmount")}</TableHead>
              <TableHead>{t("repaidAmount")}</TableHead>
              <TableHead>{t("outstanding")}</TableHead>
              <TableHead>{tCommon("notes")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.advances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {t("emptyAdvances")}
                </TableCell>
              </TableRow>
            ) : (
              staff.advances.map((adv: any) => {
                const acc = Array.isArray(adv.cash_accounts) ? adv.cash_accounts[0] : adv.cash_accounts;
                const outstanding = Number(adv.amount) - Number(adv.repaid_amount || 0);
                return (
                  <TableRow key={adv.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(adv.issue_date, locale)}</TableCell>
                    <TableCell className="font-medium">{acc?.name ?? tCommon("dash")}</TableCell>
                    <TableCell className="font-semibold">{formatPkr(adv.amount, locale)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">{formatPkr(adv.repaid_amount || 0, locale)}</TableCell>
                    <TableCell className="font-bold text-amber-600 dark:text-amber-400">{formatPkr(outstanding, locale)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{adv.notes || tCommon("dash")}</TableCell>
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
            <h2 className="font-semibold text-sm">{t("payrollHistory")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("payrollCount", { count: (staff.payroll || []).length })}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("periodMonth")}</TableHead>
              <TableHead>{t("basicSalary")}</TableHead>
              <TableHead>{t("advanceDeduction")}</TableHead>
              <TableHead>{t("otherDeductions")}</TableHead>
              <TableHead>{t("bonusAdditions")}</TableHead>
              <TableHead>{t("netSalaryPaid")}</TableHead>
              <TableHead>{t("disbursedAt")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.payroll.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  {t("emptyPayroll")}
                </TableCell>
              </TableRow>
            ) : (
              staff.payroll.map((pay: any) => (
                <TableRow key={pay.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold font-mono text-xs text-primary">{pay.period_month}</TableCell>
                  <TableCell className="font-medium">{formatPkr(pay.basic_salary, locale)}</TableCell>
                  <TableCell className="text-amber-600 dark:text-amber-400 font-medium">{formatPkr(pay.advance_deduction || 0, locale)}</TableCell>
                  <TableCell className="text-rose-600 dark:text-rose-400 font-medium">{formatPkr(pay.other_deduction || 0, locale)}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">{formatPkr(pay.bonus || 0, locale)}</TableCell>
                  <TableCell className="font-bold text-foreground">{formatPkr(pay.net_salary, locale)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{pay.paid_at ? formatDate(pay.paid_at, locale) : tCommon("dash")}</TableCell>
                  <TableCell>
                    <Badge variant={pay.payment_status === "paid" ? "secondary" : "outline" } className="rounded-md">
                      {tPay(pay.payment_status)}
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
