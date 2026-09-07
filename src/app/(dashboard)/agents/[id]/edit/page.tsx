import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageAgents } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { updateAgent } from "@/lib/actions/agents";
import { AGENT_STATUS_LABELS, AGENT_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
  const { id } = await params;
  const t = await getTranslations("agents");
  const tTypes = await getTranslations("labels.agentType");
  const tStatus = await getTranslations("labels.agentStatus");
  const tCommon = await getTranslations("common");

  if (!canManageAgents(profile.role)) {
    redirect(`/agents/${id}`);
  }

  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, phone, email, agency_name, agent_type, commission_rate, status")
    .eq("id", id)
    .maybeSingle();

  if (!agent) {
    notFound();
  }

  const updateAction = updateAgent.bind(null, agent.id);
  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none";
  const labelClass =
    "block text-xs font-semibold uppercase text-slate-600 mb-1";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("editBrokerTitle")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("editSubtitle", { name: agent.name })}
          </p>
        </div>
        <Button render={<Link href={`/agents/${id}`} />} variant="outline">
          {tCommon("cancel")}
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <form action={updateAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("fullName")}</label>
              <input type="text" name="name" required defaultValue={agent.name} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("phoneWhatsapp")}</label>
              <input type="text" name="phone" required defaultValue={agent.phone} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("agencyName")}</label>
              <input type="text" name="agency_name" defaultValue={agent.agency_name ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("emailAddress")}</label>
              <input type="email" name="email" defaultValue={agent.email ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("agentType")}</label>
              <select name="agent_type" required defaultValue={agent.agent_type} className={inputClass}>
                {Object.keys(AGENT_TYPE_LABELS).map((typeKey) => (
                  <option key={typeKey} value={typeKey}>{tTypes(typeKey as never)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("defaultRate")}</label>
              <input
                type="number"
                name="commission_rate"
                step="0.1"
                defaultValue={agent.commission_rate ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t("status")}</label>
              <select name="status" defaultValue={agent.status} className={inputClass}>
                {Object.keys(AGENT_STATUS_LABELS).map((key) => (
                  <option key={key} value={key}>{tStatus(key as never)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700">
              {t("updateRecord")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
