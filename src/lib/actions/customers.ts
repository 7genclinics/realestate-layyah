"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { customerSchema } from "@/lib/validations/customer";

export async function createCustomer(input: unknown) {
  const parsed = customerSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid customer details" };
  }

  const { profile } = await requireProfile();

  if (!canManageCrm(profile.role)) {
    return { error: "You do not have permission to add customers." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { data, error } = await supabase
    .from("customers")
    .insert({
      full_name: values.full_name.trim(),
      relation: values.relation,
      guardian_name: values.guardian_name ?? null,
      caste: values.caste ?? null,
      id_type: values.id_type,
      id_number: values.id_number ?? null,
      phone: values.phone.trim(),
      phone_secondary: values.phone_secondary ?? null,
      address: values.address ?? null,
      source: values.source,
      stage: values.stage,
      notes: values.notes ?? null,
      assigned_to: profile.id,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create customer." };
  }

  revalidatePath("/customers");
  return { error: null, id: data.id };
}

export async function updateCustomer(id: string, input: unknown) {
  const parsed = customerSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid customer details" };
  }

  const { profile } = await requireProfile();

  if (!canManageCrm(profile.role)) {
    return { error: "You do not have permission to edit customers." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { error } = await supabase
    .from("customers")
    .update({
      full_name: values.full_name.trim(),
      relation: values.relation,
      guardian_name: values.guardian_name ?? null,
      caste: values.caste ?? null,
      id_type: values.id_type,
      id_number: values.id_number ?? null,
      phone: values.phone.trim(),
      phone_secondary: values.phone_secondary ?? null,
      address: values.address ?? null,
      source: values.source,
      stage: values.stage,
      notes: values.notes ?? null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { error: null, id };
}

export async function deleteCustomer(id: string): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageCrm(profile.role)) return;
  const supabase = await createClient();
  await supabase.from("customers").delete().eq("id", id);
  revalidatePath("/customers");
}

const RELATIONS = ["s_o", "w_o", "d_o", "c_o", "other"];
const ID_TYPES = ["cnic", "passport", "other"];
const SOURCES = ["walk_in", "referral", "agent", "campaign", "other"];
const STAGES = [
  "lead",
  "negotiation",
  "booked",
  "agreement_pending",
  "active_emi",
  "fully_paid",
  "registry_pending",
  "closed",
  "cancelled",
];

function pickEnum(value: unknown, allowed: string[], fallback: string): string {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return allowed.includes(v) ? v : fallback;
}

export type ImportResult = {
  error: string | null;
  inserted: number;
  failed: { line: number; name: string; reason: string }[];
};

/**
 * Bulk-import customers from a parsed CSV. Enum-ish columns are coerced to a
 * sane default when blank or unrecognized, so a messy spreadsheet still imports;
 * only rows that fail the hard rules (name / phone) are rejected and reported.
 */
export async function importCustomers(rows: unknown): Promise<ImportResult> {
  const { profile } = await requireProfile();

  if (!canManageCrm(profile.role)) {
    return { error: "You do not have permission to import customers.", inserted: 0, failed: [] };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "No rows found to import.", inserted: 0, failed: [] };
  }

  if (rows.length > 1000) {
    return { error: "Please import 1000 rows or fewer at a time.", inserted: 0, failed: [] };
  }

  const failed: ImportResult["failed"] = [];
  const payloads: Database["public"]["Tables"]["customers"]["Insert"][] = [];

  rows.forEach((raw, index) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => {
      const t = String(v ?? "").trim();
      return t.length ? t : undefined;
    };

    const candidate = {
      full_name: String(r.full_name ?? "").trim(),
      relation: pickEnum(r.relation, RELATIONS, "other"),
      guardian_name: str(r.guardian_name),
      caste: str(r.caste),
      id_type: pickEnum(r.id_type, ID_TYPES, "cnic"),
      id_number: str(r.id_number),
      phone: String(r.phone ?? "").trim(),
      phone_secondary: str(r.phone_secondary),
      address: str(r.address),
      source: pickEnum(r.source, SOURCES, "walk_in"),
      stage: pickEnum(r.stage, STAGES, "lead"),
      notes: str(r.notes),
    };

    const parsed = customerSchema.safeParse(candidate);
    if (!parsed.success) {
      failed.push({
        line: index + 2, // +1 for header row, +1 for 1-based
        name: candidate.full_name || "(no name)",
        reason: parsed.error.issues[0]?.message ?? "Invalid row",
      });
      return;
    }

    const v = parsed.data;
    payloads.push({
      full_name: v.full_name.trim(),
      relation: v.relation,
      guardian_name: v.guardian_name ?? null,
      caste: v.caste ?? null,
      id_type: v.id_type,
      id_number: v.id_number ?? null,
      phone: v.phone.trim(),
      phone_secondary: v.phone_secondary ?? null,
      address: v.address ?? null,
      source: v.source,
      stage: v.stage,
      notes: v.notes ?? null,
      assigned_to: profile.id,
      created_by: profile.id,
    });
  });

  if (payloads.length === 0) {
    return { error: "No valid rows to import. Check name and phone columns.", inserted: 0, failed };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert(payloads);

  if (error) {
    return { error: error.message, inserted: 0, failed };
  }

  revalidatePath("/customers");
  return { error: null, inserted: payloads.length, failed };
}
