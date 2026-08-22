import { createClient } from "@/lib/server";

export async function getSystemSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("*");

  if (error) {
    console.error("Error fetching system settings:", error);
    return {};
  }

  const settingsMap: Record<string, any> = {};
  (data || []).forEach((item: any) => {
    settingsMap[item.key] = item.value;
  });

  return settingsMap;
}

const DEFAULT_GRACE_PERIOD_DAYS = 10;

/**
 * Reads the configured installment grace period (in days). Falls back to the
 * app default when the setting is missing or unparseable. Used at read-time by
 * deriveInstallmentStatus so overdue calculations respect the org's grace window.
 */
export async function getGracePeriodDays(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "grace_period_days")
    .maybeSingle();

  const raw = data?.value;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_GRACE_PERIOD_DAYS;
}

export async function getAllUserProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }

  return data || [];
}
