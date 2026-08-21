import { requireProfile } from "@/lib/auth";
import { getSystemSettings, getAllUserProfiles } from "@/lib/settings";
import { SettingsConsole } from "@/components/features/settings-console";

export default async function SettingsPage() {
  const { profile, email, avatarUrl } = await requireProfile();
  const settings = await getSystemSettings();
  const profiles = await getAllUserProfiles();

  return (
    <SettingsConsole
      currentProfile={profile}
      currentEmail={email}
      currentAvatarUrl={avatarUrl}
      allProfiles={profiles}
      systemSettings={settings}
    />
  );
}
