"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { societySchema } from "@/lib/validations/society";

export async function createSociety(input: unknown) {
  const parsed = societySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid society details" };
  }

  const { profile } = await requireProfile();
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

export async function deleteSociety(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("societies").delete().eq("id", id);
  revalidatePath("/societies");
  revalidatePath("/dashboard");
}
