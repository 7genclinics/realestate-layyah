"use client";

import { useRef, useState } from "react";
import {
  Bell,
  Building2,
  Camera,
  CheckCircle,
  Coins,
  CreditCard,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  Mail,
  Phone,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  updateMyPassword,
  updateMyProfile,
  updateSystemPreferences,
  updateUserRole,
  toggleUserStatus,
} from "@/lib/actions/settings";
import { ROLE_LABELS } from "@/lib/constants";
import type { AppRole, Profile } from "@/lib/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export type SettingsConsoleProps = {
  currentProfile: Profile;
  currentEmail?: string;
  currentAvatarUrl?: string;
  allProfiles: Profile[];
  systemSettings: Record<string, any>;
};

export function SettingsConsole({
  currentProfile,
  currentEmail,
  currentAvatarUrl,
  allProfiles,
  systemSettings,
}: SettingsConsoleProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tToasts = useTranslations("toasts");
  const tRoles = useTranslations("labels.roles");
  const tArea = useTranslations("labels.areaUnit");
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "users" | "preferences" | "notifications"
  >("profile");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string>(currentAvatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(tToasts("imageTooLarge"));
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      toast.success(tToasts("photoSelected"));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info(tToasts("photoRemoved"));
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const formData = new FormData(e.currentTarget);
    // `avatar_url` carries only a persisted http(s) URL to preserve, or "" to remove.
    // A freshly picked file is uploaded via `avatar_file`; its data-URL preview is
    // never persisted to the database.
    if (avatarFile) {
      formData.set("avatar_file", avatarFile);
      formData.set("avatar_url", "");
    } else {
      formData.set("avatar_url", /^https?:\/\//i.test(avatarPreview) ? avatarPreview : "");
    }
    const result = await updateMyProfile(formData);
    setIsSavingProfile(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      if (result.avatarUrl) {
        setAvatarPreview(result.avatarUrl);
      }
      setAvatarFile(null);
      toast.success(tToasts("profileSynced"));
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingPassword(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateMyPassword(formData);
    setIsSavingPassword(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(tToasts("passwordUpdated"));
      (e.target as HTMLFormElement).reset();
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingPreferences(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateSystemPreferences(formData);
    setIsSavingPreferences(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(tToasts("settingsSaved"));
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    await updateUserRole(userId, newRole);
    toast.success(tToasts("roleUpdated", { role: tRoles(newRole) }));
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    await toggleUserStatus(userId, !currentStatus);
    toast.success(!currentStatus ? tToasts("userActivated") : tToasts("userSuspended"));
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Tabs Toolbar */}
      <div className="border-b">
        <div className="flex flex-wrap items-center gap-1 pb-px overflow-x-auto">
          <TabButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            icon={User}
            label={t("tabProfile")}
          />
          <TabButton
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
            icon={Lock}
            label={t("tabSecurity")}
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            icon={Users}
            label={t("tabUsers")}
            count={allProfiles.length}
          />
          <TabButton
            active={activeTab === "preferences"}
            onClick={() => setActiveTab("preferences")}
            icon={Building2}
            label={t("tabPreferences")}
          />
          <TabButton
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            icon={Bell}
            label={t("tabNotifications")}
          />
        </div>
      </div>

      {/* TAB 1: MY PROFILE & AVATAR UPLOAD */}
      {activeTab === "profile" && (
        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <h2 className="font-semibold text-base">{t("profileTitle")}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("profileHint")}
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-xl">
            {/* Smart Avatar Upload Box with Hover Effect */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 p-5 rounded-[10px] border bg-muted/20">
              {/* Interactive Round Avatar */}
              <div
                className="relative group cursor-pointer shrink-0 select-none"
                onClick={() => fileInputRef.current?.click()}
                title={t("changePhoto")}
              >
                <Avatar className="size-24 rounded-full border-2 border-primary/30 ring-4 ring-primary/10 shadow-md overflow-hidden transition-transform duration-200 group-hover:scale-105">
                  {avatarPreview ? (
                    <AvatarImage
                      src={avatarPreview}
                      alt={currentProfile.full_name}
                      className="object-cover size-full rounded-full"
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary rounded-full">
                    {initials(currentProfile.full_name || tCommon("user")) || "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Smart Hover Dark Overlay with Camera Icon */}
                <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-white text-center p-1 cursor-pointer">
                  <Camera className="size-6 mb-1 text-white animate-pulse" />
                  <span className="text-[10px] font-bold tracking-tight uppercase">{tCommon("change")}</span>
                </div>

                {/* Corner Camera Badge */}
                <div className="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background">
                  <Camera className="size-3.5" />
                </div>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("avatarTitle")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("avatarHint")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-[8px] text-xs h-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3.5 mr-1.5" />
                    {t("uploadImage")}
                  </Button>

                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-[8px] text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="size-3.5 mr-1.5" />
                      {tCommon("remove")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">{t("fullName")}</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={currentProfile.full_name || ""}
                required
                className="rounded-[8px]"
                placeholder={t("fullNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("registeredEmail")}</Label>
              <Input
                id="email"
                type="email"
                disabled
                value={currentEmail || "—"}
                className="rounded-[8px] bg-muted/40 text-muted-foreground font-mono text-xs cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">{t("emailVerified")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("contactPhone")}</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={currentProfile.phone || ""}
                className="rounded-[8px]"
                placeholder={t("phonePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("assignedRole")}</Label>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="secondary" className="rounded-md font-semibold text-xs px-2.5 py-1">
                  <ShieldCheck className="size-3.5 mr-1.5 text-primary" />
                  {tRoles(currentProfile.role as AppRole) || currentProfile.role}
                </Badge>
                <span className="text-xs text-muted-foreground">{t("managedByOwner")}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSavingProfile}>
                <Save className="size-4 mr-2" />
                {isSavingProfile ? t("savingProfile") : t("saveProfile")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORDS */}
      {activeTab === "security" && (
        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              <h2 className="font-semibold text-base">{t("securityTitle")}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("securityHint")}
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="new_password">{t("newPassword")}</Label>
              <Input
                id="new_password"
                name="new_password"
                type="password"
                required
                minLength={6}
                className="rounded-[8px]"
                placeholder={t("newPasswordPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">{t("confirmPassword")}</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={6}
                className="rounded-[8px]"
                placeholder={t("confirmPasswordPlaceholder")}
              />
            </div>

            <div className="rounded-[8px] bg-muted/40 p-3.5 space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">{t("passwordGuidelines")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>{t("passwordMin")}</li>
                <li>{t("passwordMix")}</li>
                <li>{t("passwordShare")}</li>
              </ul>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSavingPassword}>
                <Lock className="size-4 mr-2" />
                {isSavingPassword ? t("updatingPassword") : t("updatePassword")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: TEAM & ROLE PERMISSIONS */}
      {activeTab === "users" && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">{t("usersTitle")}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{t("registeredAccounts", { count: allProfiles.length })}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs uppercase font-medium text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">{t("colUser")}</th>
                  <th className="px-5 py-3">{t("colPhone")}</th>
                  <th className="px-5 py-3">{t("colRole")}</th>
                  <th className="px-5 py-3">{t("colStatus")}</th>
                  <th className="px-5 py-3 text-right">{t("colAssign")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {allProfiles.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 rounded-full border shrink-0">
                          {user.avatar_url ? (
                            <AvatarImage
                              src={user.avatar_url}
                              alt={user.full_name || tCommon("user")}
                              className="object-cover size-full rounded-full"
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary rounded-full">
                            {initials(user.full_name || tCommon("user")) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">{user.full_name || tCommon("unnamedUser")}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{tCommon("idShort", { id: user.id.slice(0, 8) })}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{user.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary" className="rounded-md font-normal text-xs">
                        {tRoles(user.role as AppRole) || user.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(user.id, user.is_active)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                      >
                        {user.is_active ? (
                          <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="size-3.5 mr-1" /> {tCommon("active")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="size-3.5 mr-1" /> {tCommon("suspended")}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <select
                        defaultValue={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as AppRole)}
                        className="rounded-[6px] border border-input bg-transparent px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {Object.keys(ROLE_LABELS).map((roleKey) => (
                          <option key={roleKey} value={roleKey}>
                            {tRoles(roleKey)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SOCIETY OS CONFIGURATIONS */}
      {activeTab === "preferences" && (
        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <h2 className="font-semibold text-base">{t("prefsTitle")}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("prefsHint")}
            </p>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="space-y-5 max-w-2xl">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="society_name">{t("orgName")}</Label>
                <Input
                  id="society_name"
                  name="society_name"
                  defaultValue={systemSettings.society_name || "Mohkam Real Estate & Housing"}
                  className="rounded-[8px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_currency">{t("currency")}</Label>
                <Input
                  id="default_currency"
                  name="default_currency"
                  defaultValue={t("currencyValue")}
                  disabled
                  className="rounded-[8px] bg-muted/40 text-muted-foreground cursor-not-allowed font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_area_unit">{t("defaultAreaUnit")}</Label>
                <select
                  id="default_area_unit"
                  name="default_area_unit"
                  defaultValue={systemSettings.default_area_unit || "marla"}
                  className="h-9 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="marla">{tArea("marla")}</option>
                  <option value="kanal">{t("kanalHint")}</option>
                  <option value="acre">{tArea("acre")}</option>
                  <option value="sq_ft">{t("sqFtHint")}</option>
                  <option value="sq_yd">{t("sqYdHint")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marla_size_sqft">{t("marlaConversion")}</Label>
                <select
                  id="marla_size_sqft"
                  name="marla_size_sqft"
                  defaultValue={String(systemSettings.marla_size_sqft || "225")}
                  className="h-9 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="225">{t("marlaPunjab")}</option>
                  <option value="272">{t("marlaGovt")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_prefix">{t("receiptPrefix")}</Label>
                <Input
                  id="receipt_prefix"
                  name="receipt_prefix"
                  defaultValue={systemSettings.receipt_prefix || "REC-"}
                  className="rounded-[8px] font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_prefix">{t("bookingPrefix")}</Label>
                <Input
                  id="booking_prefix"
                  name="booking_prefix"
                  defaultValue={systemSettings.booking_prefix || "BK-"}
                  className="rounded-[8px] font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grace_period_days">{t("gracePeriod")}</Label>
                <Input
                  id="grace_period_days"
                  name="grace_period_days"
                  type="number"
                  defaultValue={systemSettings.grace_period_days || 10}
                  className="rounded-[8px]"
                />
                <p className="text-[11px] text-muted-foreground">{t("graceHint")}</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <Button type="submit" disabled={isSavingPreferences}>
                <Save className="size-4 mr-2" />
                {isSavingPreferences ? t("savingSettings") : t("saveSettings")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: NOTIFICATION TRIGGERS */}
      {activeTab === "notifications" && (
        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              <h2 className="font-semibold text-base">{t("notifTitle")}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("notifHint")}
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-start justify-between p-4 rounded-[8px] border bg-muted/20">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{t("smsTitle")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("smsHint")}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-md text-xs">{tCommon("enabled")}</Badge>
            </div>

            <div className="flex items-start justify-between p-4 rounded-[8px] border bg-muted/20">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{t("overdueTitle")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("overdueHint")}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-md text-xs">{tCommon("enabled")}</Badge>
            </div>

            <div className="flex items-start justify-between p-4 rounded-[8px] border bg-muted/20">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{t("cashCloseTitle")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("cashCloseHint")}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-md text-xs">{tCommon("active")}</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  icon: Icon,
  active,
  onClick,
  count,
}: {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${active
          ? "border-primary text-primary font-bold"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
        }`}
    >
      <Icon className="size-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
