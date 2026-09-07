import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { canManageAgents } from "@/lib/permissions";
import { formatPkr } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, AREA_UNIT_LABELS } from "@/lib/constants";
import { AgentShareButton } from "@/components/features/agent-share-button";

export default async function AgentPortalPage() {
  const { profile } = await requireProfile();
  const locale = await getLocale();
  const t = await getTranslations("agents");
  const tStatus = await getTranslations("labels.propertyStatus");
  const tType = await getTranslations("labels.propertyType");
  const tUnit = await getTranslations("labels.areaUnit");
  const tCommon = await getTranslations("common");

  if (!canManageAgents(profile.role) && profile.role !== "agent") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select(
      "id, plot_no, property_type, area, area_unit, facing, status, asking_price, agent_notes, societies (name)",
    )
    .eq("agent_visible", true)
    .is("deleted_at", null)
    .in("status", ["available", "hold"])
    .order("plot_no", { ascending: true });

  const availableProperties = properties ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("portalListingTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("portalListingSubtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            {t("availablePlots", { count: availableProperties.length })}
          </span>
        </div>
      </div>

      {availableProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          {t("portalEmpty")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableProperties.map((prop) => {
            const societyName =
              (prop.societies as { name?: string } | null)?.name || tCommon("society");
            const typeLabel = tType(prop.property_type as keyof typeof PROPERTY_TYPE_LABELS);
            const unitLabel = tUnit(prop.area_unit as keyof typeof AREA_UNIT_LABELS);
            const shareText = [
              t("societyPlot", { society: societyName, plot: prop.plot_no }),
              t("areaType", { area: prop.area, unit: unitLabel, type: typeLabel }),
              prop.facing ? t("facing", { facing: prop.facing }) : null,
              prop.asking_price ? t("sharePrice", { amount: formatPkr(prop.asking_price, locale) }) : null,
              prop.agent_notes || null,
            ]
              .filter(Boolean)
              .join("\n");

            return (
              <div
                key={prop.id}
                className="rounded-xl border bg-card p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                    {societyName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      prop.status === "available"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {tStatus(prop.status)}
                  </span>
                </div>

                <div>
                  <p className="text-xl font-bold text-foreground">
                    {t("plotNo", { plot: prop.plot_no })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("areaType", { area: prop.area, unit: unitLabel, type: typeLabel })}
                  </p>
                </div>

                {prop.facing ? (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border">
                    {t("facing", { facing: prop.facing })}
                  </p>
                ) : null}

                {prop.agent_notes ? (
                  <p className="text-xs text-muted-foreground">{prop.agent_notes}</p>
                ) : null}

                <div className="pt-2 border-t flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("askingPrice")}</p>
                    <p className="text-lg font-bold text-foreground">
                      {prop.asking_price ? formatPkr(prop.asking_price, locale) : t("onRequest")}
                    </p>
                  </div>
                  <AgentShareButton text={shareText} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
