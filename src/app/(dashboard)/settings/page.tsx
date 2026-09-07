import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { getSystemSettings, getAllUserProfiles } from "@/lib/settings";
import { SettingsConsole } from "@/components/features/settings-console";

export default async function SettingsPage() {
  const { profile, email, avatarUrl } = await requireProfile();
  const settings = await getSystemSettings();
  const profiles = await getAllUserProfiles();
  const t = await getTranslations("pages.settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <SettingsConsole
        currentProfile={profile}
        currentEmail={email}
        currentAvatarUrl={avatarUrl}
        allProfiles={profiles}
        systemSettings={settings}
      />
    </div>
  );
}
