import { getLocale, getTranslations } from "next-intl/server";
import { getStaffMembers } from "@/lib/staff";
import { createClient } from "@/lib/server";
import { processPayrollRecord } from "@/lib/actions/staff";
import { formatPkr } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default async function MonthlyPayrollPage() {
  const { data: staffMembers } = await getStaffMembers({ pageSize: 1000 });
  const supabase = await createClient();
  const { data: accounts } = await supabase.from("cash_accounts").select("id, name");
  const locale = await getLocale();
  const t = await getTranslations("pages.staff");

  const currentMonth = new Date().toISOString().substring(0, 7);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("payrollHeading", { month: currentMonth })}
        </h1>
        <p className="text-sm text-slate-500">
          {t("payrollSubtitle")}
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">{t("payrollCalcSheet")}</h2>
        </div>

        <div className="divide-y">
          {staffMembers.map((staff: any) => (
            <div key={staff.id} className="p-6 bg-white hover:bg-slate-50 transition-colors">
              <form action={processPayrollRecord} className="space-y-4">
                <input type="hidden" name="staff_id" value={staff.id} />
                <input type="hidden" name="period_month" value={currentMonth} />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{staff.full_name}</h3>
                    <p className="text-xs text-slate-500">
                      {staff.designation} · {t("basicSalaryLine", { amount: formatPkr(staff.basic_salary, locale) })}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-amber-600">
                    {t("activeAdvanceOutstanding", { amount: formatPkr(staff.active_advance, locale) })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">{t("basicSalary")}</label>
                    <input
                      type="number"
                      name="basic_salary"
                      defaultValue={staff.basic_salary}
                      step="0.01"
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">{t("bonusAllowance")}</label>
                    <input
                      type="number"
                      name="bonus"
                      defaultValue={0}
                      step="0.01"
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">{t("advanceDeduction")}</label>
                    <input
                      type="number"
                      name="advance_deduction"
                      defaultValue={Math.min(staff.basic_salary * 0.5, staff.active_advance)}
                      step="0.01"
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">{t("otherDeductions")}</label>
                    <input
                      type="number"
                      name="other_deduction"
                      defaultValue={0}
                      step="0.01"
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="w-full sm:w-64">
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">{t("payFromAccount")}</label>
                    <select name="cash_account_id" required className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                      <option value="">{t("selectAccount")}</option>
                      {(accounts || []).map((acc: any) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-700">
                    {t("disburse")}
                  </Button>
                </div>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
