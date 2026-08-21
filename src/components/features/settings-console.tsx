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
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      toast.success("Photo selected! Click 'Save Profile Changes' to upload to Supabase & sync header.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Photo removed. Save changes to apply.");
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const formData = new FormData(e.currentTarget);
    formData.set("avatar_url", avatarPreview);
    if (avatarFile) {
      formData.set("avatar_file", avatarFile);
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
      toast.success("Profile & circular avatar synchronized successfully across system!");
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
      toast.success("Password updated successfully");
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
      toast.success("System configurations saved successfully");
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    await updateUserRole(userId, newRole);
    toast.success(`User role updated to ${ROLE_LABELS[newRole]}`);
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    await toggleUserStatus(userId, !currentStatus);
    toast.success(`User status ${!currentStatus ? "activated" : "suspended"}`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          System Settings &amp; Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile, avatar photo, security credentials, user roles, and society configuration.
        </p>
      </div>

      {/* Tabs Toolbar */}
      <div className="border-b">
        <div className="flex flex-wrap items-center gap-1 pb-px overflow-x-auto">
          <TabButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            icon={User}
            label="My Profile & Avatar"
          />
          <TabButton
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
            icon={Lock}
            label="Security &amp; Passwords"
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            icon={Users}
            label="Team &amp; Role Permissions"
            count={allProfiles.length}
          />
          <TabButton
            active={activeTab === "preferences"}
            onClick={() => setActiveTab("preferences")}
            icon={Building2}
            label="Society OS Config"
          />
          <TabButton
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            icon={Bell}
            label="Notification Triggers"
          />
        </div>
      </div>

      {/* TAB 1: MY PROFILE & AVATAR UPLOAD */}
      {activeTab === "profile" && (
        <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <h2 className="font-semibold text-base">Personal Account &amp; Profile Picture</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upload your profile photo and update contact details synced with the dashboard header.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-xl">
            <input type="hidden" name="avatar_url" value={avatarPreview} />

            {/* Smart Avatar Upload Box with Hover Effect */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 p-5 rounded-[10px] border bg-muted/20">
              {/* Interactive Round Avatar */}
              <div
                className="relative group cursor-pointer shrink-0 select-none"
                onClick={() => fileInputRef.current?.click()}
                title="Click to change profile picture"
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
                    {initials(currentProfile.full_name || "User") || "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Smart Hover Dark Overlay with Camera Icon */}
                <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-white text-center p-1 cursor-pointer">
                  <Camera className="size-6 mb-1 text-white animate-pulse" />
                  <span className="text-[10px] font-bold tracking-tight uppercase">Change</span>
                </div>

                {/* Corner Camera Badge */}
                <div className="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background">
                  <Camera className="size-3.5" />
                </div>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div>
                  <p className="text-sm font-semibold text-foreground">Profile Avatar Picture</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hover on circle or click to upload. Stored in Supabase and displayed in header.
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
                    Upload Image
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
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={currentProfile.full_name || ""}
                required
                className="rounded-[8px]"
                placeholder="e.g. Saim Sultan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Registered Account Email</Label>
              <Input
                id="email"
                type="email"
                disabled
                value={currentEmail || "—"}
                className="rounded-[8px] bg-muted/40 text-muted-foreground font-mono text-xs cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">Email is verified via Supabase Authentication.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={currentProfile.phone || ""}
                className="rounded-[8px]"
                placeholder="e.g. +92 300 1234567"
              />
            </div>

            <div className="space-y-2">
              <Label>Assigned Role &amp; Access Level</Label>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="secondary" className="rounded-md font-semibold text-xs px-2.5 py-1">
                  <ShieldCheck className="size-3.5 mr-1.5 text-primary" />
                  {ROLE_LABELS[currentProfile.role as AppRole] || currentProfile.role}
                </Badge>
                <span className="text-xs text-muted-foreground">Managed by Society Super Admin</span>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSavingProfile}>
                <Save className="size-4 mr-2" />
                {isSavingProfile ? "Saving Profile..." : "Save Profile Changes"}
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
              <h2 className="font-semibold text-base">Change Password &amp; Account Security</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ensure your account uses a secure password of at least 6 characters.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password *</Label>
              <Input
                id="new_password"
                name="new_password"
                type="password"
                required
                minLength={6}
                className="rounded-[8px]"
                placeholder="Enter new strong password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password *</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={6}
                className="rounded-[8px]"
                placeholder="Re-enter new password"
              />
            </div>

            <div className="rounded-[8px] bg-muted/40 p-3.5 space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Password Security Guidelines:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Minimum 6 characters length.</li>
                <li>Use a combination of letters, numbers, and symbols.</li>
                <li>Never share your credentials with unauthorized personnel.</li>
              </ul>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSavingPassword}>
                <Lock className="size-4 mr-2" />
                {isSavingPassword ? "Updating Password..." : "Update Password"}
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
              <h2 className="font-semibold text-sm">System Users &amp; Role Permissions</h2>
            </div>
            <span className="text-xs text-muted-foreground">{allProfiles.length} registered accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs uppercase font-medium text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">User Profile</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Current Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {allProfiles.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-foreground">{user.full_name || "Unnamed User"}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{user.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary" className="rounded-md font-normal text-xs">
                        {ROLE_LABELS[user.role as AppRole] || user.role}
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
                            <CheckCircle className="size-3.5 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="size-3.5 mr-1" /> Suspended
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
                        {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => (
                          <option key={roleKey} value={roleKey}>
                            {roleLabel}
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
              <h2 className="font-semibold text-base">Society Management &amp; Real Estate Defaults</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Configure standard measurement units, financial currency, auto-code prefixes, and grace periods.
            </p>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="space-y-5 max-w-2xl">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="society_name">Organization / Group Name</Label>
                <Input
                  id="society_name"
                  name="society_name"
                  defaultValue={systemSettings.society_name || "Mohkam Real Estate & Housing"}
                  className="rounded-[8px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_currency">Primary Operating Currency</Label>
                <Input
                  id="default_currency"
                  name="default_currency"
                  defaultValue="PKR (Pakistani Rupee)"
                  disabled
                  className="rounded-[8px] bg-muted/40 text-muted-foreground cursor-not-allowed font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_area_unit">Default Area Unit</Label>
                <select
                  id="default_area_unit"
                  name="default_area_unit"
                  defaultValue={systemSettings.default_area_unit || "marla"}
                  className="h-9 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="marla">Marla</option>
                  <option value="kanal">Kanal (1 Kanal = 20 Marla)</option>
                  <option value="acre">Acre</option>
                  <option value="sq_ft">Square Feet (Sq Ft)</option>
                  <option value="sq_yd">Square Yards (Sq Yd)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marla_size_sqft">Standard Marla Conversion (Sq Ft)</Label>
                <select
                  id="marla_size_sqft"
                  name="marla_size_sqft"
                  defaultValue={String(systemSettings.marla_size_sqft || "225")}
                  className="h-9 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="225">225 Sq Ft (Punjab / Lahore Standard)</option>
                  <option value="272">272.25 Sq Ft (Revenue / Govt Standard)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_prefix">Receipt Voucher Prefix</Label>
                <Input
                  id="receipt_prefix"
                  name="receipt_prefix"
                  defaultValue={systemSettings.receipt_prefix || "REC-"}
                  className="rounded-[8px] font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_prefix">Sale Booking Prefix</Label>
                <Input
                  id="booking_prefix"
                  name="booking_prefix"
                  defaultValue={systemSettings.booking_prefix || "BK-"}
                  className="rounded-[8px] font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grace_period_days">Installment Grace Period (Days)</Label>
                <Input
                  id="grace_period_days"
                  name="grace_period_days"
                  type="number"
                  defaultValue={systemSettings.grace_period_days || 10}
                  className="rounded-[8px]"
                />
                <p className="text-[11px] text-muted-foreground">Days after due date before marking installment overdue</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <Button type="submit" disabled={isSavingPreferences}>
                <Save className="size-4 mr-2" />
                {isSavingPreferences ? "Saving Settings..." : "Save System Settings"}
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
              <h2 className="font-semibold text-base">Automated Notification &amp; Collection Triggers</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Configure automatic alerts for upcoming installment dates and overdue milestone collections.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-start justify-between p-4 rounded-[8px] border bg-muted/20">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Upcoming Installment SMS / WhatsApp Reminder</p>
                <p className="text-xs text-muted-foreground">
                  Send notification alert to customer 3 days prior to milestone due date.
                </p>
              </div>
              <Badge variant="secondary" className="rounded-md text-xs">Enabled</Badge>
            </div>

            <div className="flex items-start justify-between p-4 rounded-[8px] border bg-muted/20">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Overdue Recovery Alert</p>
                <p className="text-xs text-muted-foreground">
                  Notify CRM and recovery agents when an installment exceeds grace period.
                </p>
              </div>
              <Badge variant="secondary" className="rounded-md text-xs">Enabled</Badge>
            </div>

            <div className="flex items-start justify-between p-4 rounded-[8px] border bg-muted/20">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Daily Cash Book Closing Summary</p>
                <p className="text-xs text-muted-foreground">
                  Compile daily receipts vs expenses and notify executive management.
                </p>
              </div>
              <Badge variant="secondary" className="rounded-md text-xs">Active</Badge>
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
