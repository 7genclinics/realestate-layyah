"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { canManageSocieties } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { societySchema } from "@/lib/validations/society";

export async function createSociety(input: unknown) {
  const parsed = societySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid society details" };
  }

  const { profile } = await requireProfile();

  if (!canManageSocieties(profile.role)) {
    return { error: "You do not have permission to create societies." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("societies").insert({
    name: parsed.data.name.trim(),
    location: parsed.data.location?.trim() || null,
    status: parsed.data.status,
    notes: parsed.data.notes?.trim() || null,
    created_by: profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/societies");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteSociety(id: string): Promise<{ error: string | null }> {
  const { profile } = await requireProfile();

  if (!canManageSocieties(profile.role)) {
    return { error: "You do not have permission to delete societies." };
  }

  const supabase = await createClient();

  // Refuse to delete a society that still anchors live inventory — this would
  // orphan plots, sales and receipts. Ask the operator to clear them first.
  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("society_id", id)
    .is("deleted_at", null);

  if ((count ?? 0) > 0) {
    return {
      error: `This society still has ${count} plot(s). Remove or reassign them before deleting.`,
    };
  }

  // Soft delete so historical references stay intact.
  const { error } = await supabase
    .from("societies")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/societies");
  revalidatePath("/dashboard");
  return { error: null };
}
