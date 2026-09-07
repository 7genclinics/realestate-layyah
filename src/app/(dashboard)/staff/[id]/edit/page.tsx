import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageStaff } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { updateStaffMember } from "@/lib/actions/staff";
import { STAFF_DEPARTMENT_LABELS, STAFF_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
  const { id } = await params;
  const t = await getTranslations("pages.staff");
  const tDept = await getTranslations("labels.staffDepartment");
  const tStatus = await getTranslations("labels.staffStatus");
  const tCommon = await getTranslations("common");

  if (!canManageStaff(profile.role)) {
    redirect(`/staff/${id}`);
  }

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, full_name, phone, cnic, designation, department, basic_salary, status")
    .eq("id", id)
    .maybeSingle();

  if (!staff) {
    notFound();
  }

  const updateAction = updateStaffMember.bind(null, staff.id);
  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none";
  const labelClass =
    "block text-xs font-semibold uppercase text-slate-600 mb-1";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("editTitle")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("editSubtitle", { name: staff.full_name })}
          </p>
        </div>
        <Button render={<Link href={`/staff/${id}`} />} variant="outline">
          {tCommon("cancel")}
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <form action={updateAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("fullName")}</label>
              <input type="text" name="full_name" required defaultValue={staff.full_name} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("phoneNumber")}</label>
              <input type="text" name="phone" required defaultValue={staff.phone} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("cnicNumber")}</label>
              <input type="text" name="cnic" defaultValue={staff.cnic ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("designation")}</label>
              <input type="text" name="designation" required defaultValue={staff.designation} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("department")}</label>
              <select name="department" required defaultValue={staff.department} className={inputClass}>
                {Object.keys(STAFF_DEPARTMENT_LABELS).map((deptKey) => (
                  <option key={deptKey} value={deptKey}>{tDept(deptKey as never)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("basicSalaryLabel")}</label>
              <input
                type="number"
                name="basic_salary"
                step="0.01"
                required
                defaultValue={staff.basic_salary ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{tCommon("status")}</label>
              <select name="status" defaultValue={staff.status} className={inputClass}>
                {Object.keys(STAFF_STATUS_LABELS).map((key) => (
                  <option key={key} value={key}>{tStatus(key as never)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700">
              {t("updateEmployee")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
