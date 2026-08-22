import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { canManageAgents } from "@/lib/permissions";
import { formatPkr } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { AgentShareButton } from "@/components/features/agent-share-button";

export default async function AgentPortalPage() {
  const { profile } = await requireProfile();

  // The portal is for agents themselves plus the sales desk that manages them.
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
            Agent Property Inventory Listing
          </h1>
          <p className="text-sm text-muted-foreground">
            Sanitized shareable inventory for local and overseas sales agents.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            {availableProperties.length} Available Plots
          </span>
        </div>
      </div>

      {availableProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          No plots are currently flagged as visible to agents. Mark inventory as
          “Agent visible” from the plot detail page to list it here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableProperties.map((prop) => {
            const societyName =
              (prop.societies as { name?: string } | null)?.name || "Society";
            const typeLabel =
              PROPERTY_TYPE_LABELS[
                prop.property_type as keyof typeof PROPERTY_TYPE_LABELS
              ] || prop.property_type;
            const shareText = [
              `${societyName} — Plot #${prop.plot_no}`,
              `${prop.area} ${prop.area_unit} · ${typeLabel}`,
              prop.facing ? `Facing: ${prop.facing}` : null,
              prop.asking_price ? `Price: ${formatPkr(prop.asking_price)}` : null,
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
                    {PROPERTY_STATUS_LABELS[
                      prop.status as keyof typeof PROPERTY_STATUS_LABELS
                    ] || prop.status}
                  </span>
                </div>

                <div>
                  <p className="text-xl font-bold text-foreground">
                    Plot #{prop.plot_no}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {prop.area} {prop.area_unit} · {typeLabel}
                  </p>
                </div>

                {prop.facing ? (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border">
                    Facing: {prop.facing}
                  </p>
                ) : null}

                {prop.agent_notes ? (
                  <p className="text-xs text-muted-foreground">{prop.agent_notes}</p>
                ) : null}

                <div className="pt-2 border-t flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Asking Price</p>
                    <p className="text-lg font-bold text-foreground">
                      {prop.asking_price ? formatPkr(prop.asking_price) : "On request"}
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
