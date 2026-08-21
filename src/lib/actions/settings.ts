"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import { requireProfile } from "@/lib/auth";
import type { AppRole } from "@/lib/database.types";

export async function updateSystemSetting(key: string, value: any): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("system_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  revalidatePath("/settings");
}

export async function updateUserRole(userId: string, role: AppRole): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  revalidatePath("/settings");
}

export async function toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", userId);

  revalidatePath("/settings");
}

export async function updateMyProfile(formData: FormData): Promise<{ error?: string; success?: boolean; avatarUrl?: string }> {
  try {
    const { profile } = await requireProfile();
    const fullName = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    let avatarUrl = (formData.get("avatar_url") as string) || "";
    const avatarFile = formData.get("avatar_file");

    if (!fullName || fullName.trim().length < 2) {
      return { error: "Please provide a valid full name." };
    }

    const supabase = await createClient();

    // If a physical image file was uploaded, store in Supabase Storage
    if (avatarFile instanceof File && avatarFile.size > 0) {
      const ext = avatarFile.name.split(".").pop() || "jpg";
      const filePath = `${profile.id}/${Date.now()}.${ext}`;
      const buffer = Buffer.from(await avatarFile.arrayBuffer());

      // Auto-create avatars bucket if not already created
      try {
        await supabase.storage.createBucket("avatars", { public: true });
      } catch {
        // Bucket already exists
      }

      // Upload to dedicated avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, buffer, {
          contentType: avatarFile.type,
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        if (publicData?.publicUrl) {
          avatarUrl = publicData.publicUrl;
        }
      } else {
        // Fallback to documents bucket
        const docPath = `avatars/${profile.id}/${Date.now()}.${ext}`;
        const { error: docError } = await supabase.storage
          .from("documents")
          .upload(docPath, buffer, {
            contentType: avatarFile.type,
            upsert: true,
          });

        if (!docError) {
          const { data: docData } = supabase.storage.from("documents").getPublicUrl(docPath);
          if (docData?.publicUrl) {
            avatarUrl = docData.publicUrl;
          }
        }
      }
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone ? phone.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (profileError) {
      return { error: profileError.message };
    }

    // Sync avatar & display name to Auth User Metadata
    await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl,
        full_name: fullName.trim(),
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, avatarUrl };
  } catch (err: any) {
    return { error: err.message || "Failed to update profile." };
  }
}

export async function updateMyPassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const newPassword = formData.get("new_password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (!newPassword || newPassword.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    if (newPassword !== confirmPassword) {
      return { error: "Passwords do not match." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update password." };
  }
}

export async function updateSystemPreferences(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const societyName = (formData.get("society_name") as string) || "Mohkam Real Estate";
    const defaultCurrency = (formData.get("default_currency") as string) || "PKR";
    const defaultAreaUnit = (formData.get("default_area_unit") as string) || "marla";
    const marlaSizeSqft = parseInt((formData.get("marla_size_sqft") as string) || "225", 10);
    const receiptPrefix = (formData.get("receipt_prefix") as string) || "REC-";
    const bookingPrefix = (formData.get("booking_prefix") as string) || "BK-";
    const gracePeriodDays = parseInt((formData.get("grace_period_days") as string) || "10", 10);

    const supabase = await createClient();
    await supabase.from("system_settings").upsert([
      { key: "society_name", value: societyName, updated_at: new Date().toISOString() },
      { key: "default_currency", value: defaultCurrency, updated_at: new Date().toISOString() },
      { key: "default_area_unit", value: defaultAreaUnit, updated_at: new Date().toISOString() },
      { key: "marla_size_sqft", value: marlaSizeSqft, updated_at: new Date().toISOString() },
      { key: "receipt_prefix", value: receiptPrefix, updated_at: new Date().toISOString() },
      { key: "booking_prefix", value: bookingPrefix, updated_at: new Date().toISOString() },
      { key: "grace_period_days", value: gracePeriodDays, updated_at: new Date().toISOString() },
    ]);

    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to save settings." };
  }
}
