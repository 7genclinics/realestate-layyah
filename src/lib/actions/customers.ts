"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
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

export async function deleteCustomer(id: string): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageCrm(profile.role)) return;
  const supabase = await createClient();
  await supabase.from("customers").delete().eq("id", id);
  revalidatePath("/customers");
}
