import { createStaffMember } from "@/lib/actions/staff";
import { STAFF_DEPARTMENT_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default function NewStaffPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Add New Employee / Staff Member
        </h1>
        <p className="text-sm text-slate-500">
          Register an employee record to manage monthly salary disbursement and advances.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <form action={createStaffMember} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="e.g. Muhammad Ali"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                required
                placeholder="e.g. +92 321 9876543"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                CNIC Number
              </label>
              <input
                type="text"
                name="cnic"
                placeholder="35202-1234567-1"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Designation *
              </label>
              <input
                type="text"
                name="designation"
                required
                placeholder="e.g. Site Supervisor / Accountant"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Department *
              </label>
              <select
                name="department"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                {Object.entries(STAFF_DEPARTMENT_LABELS).map(([deptKey, deptLabel]) => (
                  <option key={deptKey} value={deptKey}>{deptLabel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Basic Monthly Salary (PKR) *
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
              Save Employee Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
