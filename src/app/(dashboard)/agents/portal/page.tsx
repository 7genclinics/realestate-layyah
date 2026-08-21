import { createClient } from "@/lib/server";
import { formatPkr } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AgentPortalPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("id, plot_number, property_type, total_area, area_unit, facing, status, asking_price, notes, societies (name)")
    .order("plot_number", { ascending: true });

  const availableProperties = (properties || []).filter((p: any) => p.status === "available" || p.status === "hold");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Agent Property Inventory Listing
          </h1>
          <p className="text-sm text-slate-500">
            Sanitized shareable inventory for local and overseas sales agents.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            {availableProperties.length} Available Plots
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availableProperties.map((prop: any) => (
          <div key={prop.id} className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                {prop.societies?.name || "Society"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prop.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {PROPERTY_STATUS_LABELS[prop.status as keyof typeof PROPERTY_STATUS_LABELS] || prop.status}
              </span>
            </div>

            <div>
              <p className="text-xl font-bold text-slate-900">Plot #{prop.plot_number}</p>
              <p className="text-sm text-slate-500">
                {prop.total_area} {prop.area_unit} · {PROPERTY_TYPE_LABELS[prop.property_type as keyof typeof PROPERTY_TYPE_LABELS] || prop.property_type}
              </p>
            </div>

            {prop.facing ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border">
                Facing: {prop.facing}
              </p>
            ) : null}

            <div className="pt-2 border-t flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Asking Price</p>
                <p className="text-lg font-bold text-slate-900">{formatPkr(prop.asking_price)}</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                <Share2 className="mr-1 size-3" /> Share
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
