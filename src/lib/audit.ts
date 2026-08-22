import { createClient } from "@/lib/server";
import type { Activity, AuditLog } from "@/lib/database.types";

/**
 * Audit-log & CRM-activity helpers.
 *
 * These are intentionally non-fatal: if the underlying table does not yet
 * exist (migration not run) or the insert is blocked by RLS, we swallow the
 * error so the calling action still succeeds. Logging is a side effect, never
 * the reason a booking / receipt / edit fails.
 */

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function resolveActor(supabase: SupabaseServerClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function logAudit(input: {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  actorId?: string | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const actorId = input.actorId ?? (await resolveActor(supabase));
    await supabase.from("audit_log").insert({
      actor_id: actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      summary: input.summary,
      metadata: (input.metadata ?? null) as never,
    });
  } catch (err) {
    console.error("logAudit failed (non-fatal):", err);
  }
}

export async function logActivity(input: {
  entityType: string;
  entityId: string;
  activityType: string;
  subject?: string | null;
  body?: string | null;
  actorId?: string | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const actorId = input.actorId ?? (await resolveActor(supabase));
    await supabase.from("activities").insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      activity_type: input.activityType,
      subject: input.subject ?? null,
      body: input.body ?? null,
      actor_id: actorId,
    });
  } catch (err) {
    console.error("logActivity failed (non-fatal):", err);
  }
}

export type AuditLogWithActor = AuditLog & {
  actor: { full_name: string | null; avatar_url: string | null } | null;
};

export async function getRecentAudit(limit = 200): Promise<AuditLogWithActor[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("*, actor:profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as AuditLogWithActor[];
  } catch (err) {
    console.error("getRecentAudit failed:", err);
    return [];
  }
}

export async function getEntityAudit(
  entityType: string,
  entityId: string,
): Promise<AuditLogWithActor[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("*, actor:profiles(full_name, avatar_url)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AuditLogWithActor[];
  } catch (err) {
    console.error("getEntityAudit failed:", err);
    return [];
  }
}

export type ActivityWithActor = Activity & {
  actor: { full_name: string | null; avatar_url: string | null } | null;
};

export async function getActivities(
  entityType: string,
  entityId: string,
): Promise<ActivityWithActor[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activities")
      .select("*, actor:profiles(full_name, avatar_url)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ActivityWithActor[];
  } catch (err) {
    console.error("getActivities failed:", err);
    return [];
  }
}
