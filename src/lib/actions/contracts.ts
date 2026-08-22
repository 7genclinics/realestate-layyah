"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { roundMoney } from "@/lib/installments";
import { canManageParties } from "@/lib/permissions";
import { createClient } from "@/lib/server";

const CONTRACT_UNITS = [
  "foot",
  "sq_ft",
  "trailer",
  "dumper",
  "daily",
  "pipe",
  "lump_sum",
  "other",
] as const;

const measurementSchema = z.object({
  contract_id: z.string().uuid("A contract is required"),
  entry_date: z.string().min(1, "Date is required"),
  description: z.string().min(2, "Description is required"),
  unit: z.enum(CONTRACT_UNITS),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
});

const materialSchema = z.object({
  contract_id: z.string().uuid("A contract is required"),
  name: z.string().min(2, "Material name is required"),
  unit: z.string().optional(),
  quantity_ordered: z.coerce.number().min(0, "Quantity cannot be negative"),
  quantity_received: z.coerce.number().min(0, "Quantity cannot be negative"),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
  notes: z.string().optional(),
});

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function partyIdForContract(
  supabase: SupabaseServerClient,
  contractId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("contracts")
    .select("party_id")
    .eq("id", contractId)
    .maybeSingle();
  return data?.party_id ?? null;
}

function revalidateContract(partyId: string | null, contractId: string) {
  if (partyId) {
    revalidatePath(`/parties/${partyId}/contracts/${contractId}`);
    revalidatePath(`/parties/${partyId}`);
  }
}

export async function addMeasurementEntry(input: unknown) {
  const parsed = measurementSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid measurement" };
  }

  const { profile } = await requireProfile();
  if (!canManageParties(profile.role)) {
    return { error: "You do not have permission to record measurements." };
  }

  const supabase = await createClient();
  const v = parsed.data;
  const amount = roundMoney(v.quantity * v.rate);

  const { error } = await supabase.from("measurement_entries").insert({
    contract_id: v.contract_id,
    entry_date: v.entry_date,
    description: v.description.trim(),
    unit: v.unit,
    quantity: v.quantity,
    rate: v.rate,
    amount,
    recorded_by: profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "create",
    entityType: "contract",
    entityId: v.contract_id,
    summary: `Measurement recorded: ${v.description.trim()} (${amount.toLocaleString()})`,
    actorId: profile.id,
  });

  revalidateContract(await partyIdForContract(supabase, v.contract_id), v.contract_id);
  return { error: null };
}

export async function deleteMeasurementEntry(id: string, contractId: string) {
  const { profile } = await requireProfile();
  if (!canManageParties(profile.role)) {
    return { error: "You do not have permission to delete measurements." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("measurement_entries").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidateContract(await partyIdForContract(supabase, contractId), contractId);
  return { error: null };
}

export async function addMaterialItem(input: unknown) {
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid material" };
  }

  const { profile } = await requireProfile();
  if (!canManageParties(profile.role)) {
    return { error: "You do not have permission to record materials." };
  }

  const supabase = await createClient();
  const v = parsed.data;
  // Value of the line: bill for what was received, else fall back to the order.
  const qty = v.quantity_received > 0 ? v.quantity_received : v.quantity_ordered;
  const amount = roundMoney(qty * v.rate);

  const { error } = await supabase.from("material_items").insert({
    contract_id: v.contract_id,
    name: v.name.trim(),
    unit: v.unit?.trim() || null,
    quantity_ordered: v.quantity_ordered,
    quantity_received: v.quantity_received,
    rate: v.rate,
    amount,
    notes: v.notes?.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "create",
    entityType: "contract",
    entityId: v.contract_id,
    summary: `Material added: ${v.name.trim()}`,
    actorId: profile.id,
  });

  revalidateContract(await partyIdForContract(supabase, v.contract_id), v.contract_id);
  return { error: null };
}

export async function deleteMaterialItem(id: string, contractId: string) {
  const { profile } = await requireProfile();
  if (!canManageParties(profile.role)) {
    return { error: "You do not have permission to delete materials." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("material_items").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidateContract(await partyIdForContract(supabase, contractId), contractId);
  return { error: null };
}
