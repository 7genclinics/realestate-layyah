import { getTranslations } from "next-intl/server";
import { getDevelopmentProjects } from "@/lib/development";
import { createClient } from "@/lib/server";
import { createDevelopmentProject, addDevelopmentExpense } from "@/lib/actions/development";
import { DEVELOPMENT_CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default async function NewDevelopmentEntryPage() {
  const supabase = await createClient();
  const t = await getTranslations("pages.development");
  const tCat = await getTranslations("labels.developmentCategory");
  const tType = await getTranslations("labels.partyType");

  const { data: societies } = await supabase.from("societies").select("id, name");
  const { data: parties } = await supabase.from("parties").select("id, name, party_type");
  const { data: accounts } = await supabase.from("cash_accounts").select("id, name");

  const { data: projects } = await getDevelopmentProjects({ pageSize: 1000 });

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("addRecordTitle")}
        </h1>
        <p className="text-sm text-slate-500">
          {t("addRecordSubtitle")}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b pb-3">
          {t("configureProject")}
        </h2>
        <form action={createDevelopmentProject} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("societyProject")}
              </label>
              <select
                name="society_id"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">{t("selectSociety")}</option>
                {(societies || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("developmentCategory")}
              </label>
              <select
                name="category"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">{t("selectCategory")}</option>
                {Object.keys(DEVELOPMENT_CATEGORY_LABELS).map((catKey) => (
                  <option key={catKey} value={catKey}>{tCat(catKey)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("projectNameLabel")}
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder={t("projectNamePlaceholder")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("allocatedBudget")}
              </label>
              <input
                type="number"
                name="budget"
                step="0.01"
                placeholder={t("budgetPlaceholder")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              {t("descriptionNotes")}
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder={t("scopePlaceholder")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <Button type="submit" className="bg-sky-600 hover:bg-sky-700">
            {t("createProject")}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b pb-3">
          {t("recordExpense")}
        </h2>
        <form action={addDevelopmentExpense} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("developmentProject")}
              </label>
              <select
                name="project_id"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">{t("selectProject")}</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.societies?.name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("vendorContractor")}
              </label>
              <select
                name="party_id"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">{t("directExpense")}</option>
                {(parties || []).map((pty: any) => (
                  <option key={pty.id} value={pty.id}>{pty.name} ({tType(pty.party_type)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("amountPaid")}
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                placeholder={t("amountPlaceholder")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("paidFrom")}
              </label>
              <select
                name="cash_account_id"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">{t("selectAccount")}</option>
                {(accounts || []).map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                {t("expenseDateLabel")}
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
              {t("expenseDescription")}
            </label>
            <input
              type="text"
              name="description"
              required
              placeholder={t("expensePlaceholder")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            {t("saveExpense")}
          </Button>
        </form>
      </div>
    </div>
  );
}
