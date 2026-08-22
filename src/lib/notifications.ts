import { createClient } from "@/lib/server";
import type { AppRole, Notification } from "@/lib/database.types";

/**
 * Notification helpers. Writes are non-fatal (see audit.ts rationale); reads
 * fall back to an empty list so the bell/panel never breaks the page shell.
 */

export async function createNotification(input: {
  type: string;
  title: string;
  body?: string | null;
  userId?: string | null;
  roleTarget?: AppRole | null;
  entityType?: string | null;
  entityId?: string | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      user_id: input.userId ?? null,
      role_target: input.roleTarget ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });
  } catch (err) {
    console.error("createNotification failed (non-fatal):", err);
  }
}

export async function getMyNotifications(limit = 30): Promise<{
  items: Notification[];
  unread: number;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { items: [], unread: 0 };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ?? null;

    // Notifications addressed to me directly OR broadcast to my role.
    const orFilter = role
      ? `user_id.eq.${user.id},role_target.eq.${role}`
      : `user_id.eq.${user.id}`;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or(orFilter)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const items = (data ?? []) as Notification[];
    const unread = items.filter((n) => !n.is_read).length;
    return { items, unread };
  } catch (err) {
    console.error("getMyNotifications failed:", err);
    return { items: [], unread: 0 };
  }
}
