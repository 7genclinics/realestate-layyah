"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";

type ActionResult = { error: string | null };

/** Mark a single notification as read. */
export async function markNotificationRead(id: string): Promise<ActionResult> {
  if (!id) return { error: "Missing notification reference." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}

/** Mark every notification addressed to the current user (or their role) as read. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? null;
  const orFilter = role
    ? `user_id.eq.${user.id},role_target.eq.${role}`
    : `user_id.eq.${user.id}`;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .or(orFilter)
    .eq("is_read", false);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}
