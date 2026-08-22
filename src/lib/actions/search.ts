"use server";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";

export type SearchHit = {
  id: string;
  label: string;
  sub?: string;
  href: string;
};

export type SearchGroup = {
  group: string;
  items: SearchHit[];
};

/**
 * Cross-module quick search. Runs a handful of capped ilike lookups in parallel
 * and returns grouped hits for the command palette. Any table that errors (e.g.
 * a not-yet-migrated leads table) is simply skipped, never fatal.
 */
export async function searchEverything(rawQuery: string): Promise<SearchGroup[]> {
  const query = (rawQuery ?? "").trim();
  if (query.length < 2) return [];

  await requireProfile();
  const supabase = await createClient();

  // Strip PostgREST or-filter delimiters so the term can't break the syntax.
  const term = query.replace(/[,()*]/g, " ").trim();
  if (!term) return [];
  const like = `%${term}%`;

  const [customers, properties, parties, leads] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, code, phone, stage")
      .or(`full_name.ilike.${like},code.ilike.${like},phone.ilike.${like}`)
      .limit(5),
    supabase
      .from("properties")
      .select("id, plot_no, code, status")
      .is("deleted_at", null)
      .or(`plot_no.ilike.${like},code.ilike.${like}`)
      .limit(5),
    supabase
      .from("parties")
      .select("id, name, code, phone")
      .or(`name.ilike.${like},code.ilike.${like},phone.ilike.${like}`)
      .limit(5),
    supabase
      .from("leads")
      .select("id, full_name, phone, status")
      .or(`full_name.ilike.${like},phone.ilike.${like}`)
      .limit(5),
  ]);

  const groups: SearchGroup[] = [];

  if (customers.data?.length) {
    groups.push({
      group: "Customers",
      items: customers.data.map((c) => ({
        id: c.id,
        label: c.full_name,
        sub: [c.code, c.phone].filter(Boolean).join(" · "),
        href: `/customers/${c.id}`,
      })),
    });
  }

  if (properties.data?.length) {
    groups.push({
      group: "Inventory",
      items: properties.data.map((p) => ({
        id: p.id,
        label: `Plot ${p.plot_no}`,
        sub: [p.code, p.status].filter(Boolean).join(" · "),
        href: `/inventory/${p.id}`,
      })),
    });
  }

  if (parties.data?.length) {
    groups.push({
      group: "Parties",
      items: parties.data.map((p) => ({
        id: p.id,
        label: p.name,
        sub: [p.code, p.phone].filter(Boolean).join(" · "),
        href: `/parties/${p.id}`,
      })),
    });
  }

  if (leads.data?.length) {
    groups.push({
      group: "Leads",
      items: leads.data.map((l) => ({
        id: l.id,
        label: l.full_name,
        sub: [l.phone, l.status].filter(Boolean).join(" · "),
        href: `/leads/${l.id}`,
      })),
    });
  }

  return groups;
}
