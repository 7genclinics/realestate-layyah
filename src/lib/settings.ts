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
