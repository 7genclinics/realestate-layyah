import { getTranslations } from "next-intl/server";
import { createStaffMember } from "@/lib/actions/staff";
import { STAFF_DEPARTMENT_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default async function NewStaffPage() {
  const t = await getTranslations("pages.staff");
  const tDept = await getTranslations("labels.staffDepartment");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("newTitle")}
        </h1>
        <p className="text-sm text-slate-500">
          {t("newSubtitle")}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <form action={createStaffMember} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("fullName")}
              </label>
              <input
                type="text"
                name="full_name"
                required
                placeholder={t("namePlaceholder")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("phoneNumber")}
              </label>
              <input
                type="text"
                name="phone"
                required
                placeholder={t("phonePlaceholder")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("cnicNumber")}
              </label>
              <input
                type="text"
                name="cnic"
                placeholder={t("cnicPlaceholder")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("designation")}
              </label>
              <input
                type="text"
                name="designation"
                required
                placeholder={t("designationPlaceholder")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("department")}
              </label>
              <select
                name="department"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                {Object.keys(STAFF_DEPARTMENT_LABELS).map((deptKey) => (
                  <option key={deptKey} value={deptKey}>{tDept(deptKey as never)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("basicSalaryLabel")}
              </label>
              <input
                type="number"
                name="basic_salary"
                step="0.01"
                required
                placeholder="e.g. 75000"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700">
              {t("saveEmployee")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
