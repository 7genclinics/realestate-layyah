import { getDevelopmentProjects } from "@/lib/development";
import { createClient } from "@/lib/server";
import { createDevelopmentProject, addDevelopmentExpense } from "@/lib/actions/development";
import { DEVELOPMENT_CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default async function NewDevelopmentEntryPage() {
  const supabase = await createClient();

  const { data: societies } = await supabase.from("societies").select("id, name");
  const { data: parties } = await supabase.from("parties").select("id, name, party_type");
  const { data: accounts } = await supabase.from("cash_accounts").select("id, name");

  const { data: projects } = await getDevelopmentProjects({ pageSize: 1000 });

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Add Development Record / Expense
        </h1>
        <p className="text-sm text-slate-500">
          Create a development project or record a development expense voucher.
        </p>
      </div>

      {/* Form 1: Create Project */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b pb-3">
          1. Configure New Development Project / Budget
        </h2>
        <form action={createDevelopmentProject} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Society / Project *
              </label>
              <select
                name="society_id"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">Select Society</option>
                {(societies || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Development Category *
              </label>
              <select
                name="category"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {Object.entries(DEVELOPMENT_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                  <option key={catKey} value={catKey}>{catLabel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Main Boulevard Sewerage & Paving"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Allocated Budget (PKR)
              </label>
              <input
                type="number"
                name="budget"
                step="0.01"
                placeholder="e.g. 5000000"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Description / Notes
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Scope of work, location, contract details..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <Button type="submit" className="bg-sky-600 hover:bg-sky-700">
            Create Project
          </Button>
        </form>
      </div>

      {/* Form 2: Record Expense */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b pb-3">
          2. Record Development Expense Voucher
        </h2>
        <form action={addDevelopmentExpense} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Development Project *
              </label>
              <select
                name="project_id"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">Select Project</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.societies?.name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Vendor / Contractor (Party)
              </label>
              <select
                name="party_id"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">Direct Expense (No Vendor)</option>
                {(parties || []).map((pty: any) => (
                  <option key={pty.id} value={pty.id}>{pty.name} ({pty.party_type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Amount Paid (PKR) *
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                placeholder="e.g. 250000"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Paid From Cash Account
              </label>
              <select
                name="cash_account_id"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">Select Account</option>
                {(accounts || []).map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Expense Date
              </label>
              <input
                type="date"
                name="expense_date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Expense Description *
            </label>
            <input
              type="text"
              name="description"
              required
              placeholder="e.g. Material supply 50 tons cement & labour payment"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            Save Expense Voucher
          </Button>
        </form>
      </div>
    </div>
  );
}
