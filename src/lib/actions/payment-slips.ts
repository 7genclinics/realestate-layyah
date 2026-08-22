"use server";

import { requireProfile } from "@/lib/auth";
import { ALLOWED_DOCUMENT_MIME, MAX_DOCUMENT_BYTES } from "@/lib/documents";
import { canManageAccounts, canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";

const SLIP_BUCKET = "payment-slips";

// Which payment surface the slip belongs to — used only to organise the path.
const SLIP_KINDS = ["receipt", "land", "party"] as const;
type SlipKind = (typeof SLIP_KINDS)[number];

const MIGRATION_HINT =
  "Slip uploads need a one-time setup. Run supabase/migrations/20260823000001_payment_slips.sql in the Supabase SQL editor to create the \"payment-slips\" bucket, then try again.";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

/**
 * Uploads a bank-transfer / cheque slip to the private `payment-slips` bucket
 * and returns its storage path. The path is then saved on the payment record
 * (receipt / land_payment / contract_payment) by the posting action. Degrades
 * with a clear "run migration" message while the bucket does not yet exist.
 */
export async function uploadPaymentSlip(
  formData: FormData,
): Promise<{ path?: string; error?: string }> {
  const { profile } = await requireProfile();

  if (!canManageAccounts(profile.role) && !canManageCrm(profile.role)) {
    return { error: "You do not have permission to upload payment slips." };
  }

  const kindRaw = String(formData.get("kind") ?? "");
  const kind: SlipKind = (SLIP_KINDS as readonly string[]).includes(kindRaw)
    ? (kindRaw as SlipKind)
    : "receipt";

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No slip file was provided." };
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "Slip is larger than the 10 MB limit." };
  }

  if (!(ALLOWED_DOCUMENT_MIME as readonly string[]).includes(file.type)) {
    return { error: "Slip must be a JPG, PNG, WEBP, or PDF file." };
  }

  const supabase = await createClient();
  const filePath = `${kind}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(SLIP_BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    if (/bucket|not found|does not exist/i.test(uploadError.message)) {
      return { error: MIGRATION_HINT };
    }
    return { error: `Slip upload failed: ${uploadError.message}` };
  }

  return { path: filePath };
}

/** Best-effort removal of an uploaded slip (used to clean up orphans). */
export async function removePaymentSlip(path: string): Promise<void> {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(SLIP_BUCKET).remove([path]);
}

/** Short-lived signed URL to view / download a stored slip. */
export async function getPaymentSlipUrl(
  path: string,
): Promise<{ url?: string; error?: string }> {
  if (!path) return { error: "No slip on this payment." };
  await requireProfile();

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(SLIP_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "Could not open slip." };
  }

  return { url: data.signedUrl };
}
