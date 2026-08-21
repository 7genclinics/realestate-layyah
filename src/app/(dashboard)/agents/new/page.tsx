import { createAgent } from "@/lib/actions/agents";
import { AGENT_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default function NewAgentPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Register New Agent / Broker
        </h1>
        <p className="text-sm text-slate-500">
          Add an independent broker or agency partner to assign deals and calculate commissions.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <form action={createAgent} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Agent Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Tariq Mehmood"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Phone / WhatsApp Number *
              </label>
              <input
                type="text"
                name="phone"
                required
                placeholder="e.g. +92 300 1234567"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Agency Name
              </label>
              <input
                type="text"
                name="agency_name"
                placeholder="e.g. Royal Estate Agency"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="agent@example.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Agent Type *
              </label>
              <select
                name="agent_type"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                {Object.entries(AGENT_TYPE_LABELS).map(([typeKey, typeLabel]) => (
                  <option key={typeKey} value={typeKey}>{typeLabel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Default Commission Rate (%)
              </label>
              <input
                type="number"
                name="commission_rate"
                step="0.1"
                placeholder="e.g. 2.5"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700">
              Save Agent Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
