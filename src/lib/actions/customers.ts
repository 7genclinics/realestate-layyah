"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { customerSchema } from "@/lib/validations/customer";

type QueryError = { code?: string; message?: string } | null;

/** CNICs are stored as digits so "35202-1234567-1" and "3520212345671" are the same person. */
function normalizeIdNumber(idType: string, value?: string | null) {
  if (!value?.trim()) return null;
  if (idType === "cnic") {
    const digits = value.replace(/\D/g, "");
    return digits || null;
  }
  const compact = value.trim().replace(/\s+/g, "").toUpperCase();
  return compact || null;
}

function isUniqueViolation(error: QueryError, constraint: string) {
  return error?.code === "23505" && (error.message ?? "").includes(constraint);
}

async function findActiveCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  idType: string,
  idNumber: string,
) {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("id_type", idType as "cnic" | "passport" | "other")
    .eq("id_number", idNumber)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

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
  const idNumber = normalizeIdNumber(values.id_type, values.id_number);

  if (idNumber) {
    const existingId = await findActiveCustomerId(supabase, values.id_type, idNumber);
    if (existingId) {
      return { error: null, id: existingId, alreadyExists: true as const };
    }
  }

  const payload = {
    full_name: values.full_name.trim(),
    relation: values.relation,
    guardian_name: values.guardian_name ?? null,
    caste: values.caste ?? null,
    id_type: values.id_type,
    id_number: idNumber,
    phone: values.phone.trim(),
    phone_secondary: values.phone_secondary ?? null,
    address: values.address ?? null,
    source: values.source,
    stage: values.stage,
    notes: values.notes ?? null,
    assigned_to: profile.id,
    created_by: profile.id,
  };

  let { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select("id")
    .single();

  // A lost response or a double click can land the row, then the retry hits
  // the CNIC unique index. Open the row that was already saved.
  if (isUniqueViolation(error, "customers_id_number_unique") && idNumber) {
    const existingId = await findActiveCustomerId(supabase, values.id_type, idNumber);
    if (existingId) {
      revalidatePath("/customers");
      return { error: null, id: existingId, alreadyExists: true as const };
    }
  }

  if (isUniqueViolation(error, "customers_code_key")) {
    const retry = await supabase.from("customers").insert(payload).select("id").single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    return { error: error?.message ?? "Could not create customer." };
  }

  revalidatePath("/customers");
  return { error: null, id: data.id, alreadyExists: false as const };
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
      id_number: normalizeIdNumber(values.id_type, values.id_number),
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
      id_number: normalizeIdNumber(v.id_type, v.id_number),
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

  if (!error) {
    revalidatePath("/customers");
    return { error: null, inserted: payloads.length, failed };
  }

  // One duplicate CNIC used to reject the whole file, and a retry then reported
  // every row as a duplicate. Save the new rows and skip the ones already on file.
  if (error.code !== "23505") {
    return { error: error.message, inserted: 0, failed };
  }

  let inserted = 0;
  for (const row of payloads) {
    const { error: rowError } = await supabase.from("customers").insert(row);
    if (!rowError) {
      inserted += 1;
      continue;
    }
    if (isUniqueViolation(rowError, "customers_id_number_unique")) {
      failed.push({
        line: 0,
        name: row.full_name,
        reason: "Already saved",
      });
      continue;
    }
    if (isUniqueViolation(rowError, "customers_code_key")) {
      const retry = await supabase.from("customers").insert(row);
      if (!retry.error) {
        inserted += 1;
        continue;
      }
    }
    failed.push({
      line: 0,
      name: row.full_name,
      reason: rowError.message,
    });
  }

  revalidatePath("/customers");
  return { error: null, inserted, failed };
}
