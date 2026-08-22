import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import type { Profile } from "@/lib/database.types";

export async function requireProfile(): Promise<{
  profile: Profile;
  email: string | undefined;
  avatarUrl: string | undefined;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/auth/login?error=inactive");
  }

  return {
    profile,
    email: user.email,
    // Prefer the persisted profiles.avatar_url; fall back to Auth metadata.
    avatarUrl:
      (profile.avatar_url as string | null) ||
      (user.user_metadata?.avatar_url as string | undefined),
  };
}
