"use client";

import { uploadPaymentSlip } from "@/lib/actions/payment-slips";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// A slip is offered only for the two "paper trail" modes.
const SLIP_MODES = new Set(["bank_transfer", "cheque"]);

export function slipRequiredForMode(mode: string) {
  return SLIP_MODES.has(mode);
}

/**
 * Uploads the chosen slip (if any) for the given payment surface and returns its
 * storage path. Returns `{}` when no file is attached. Callers set the returned
 * `path` on their form's `slip_path` before posting the payment.
 */
export async function uploadSlipFile(
  kind: "receipt" | "land" | "party",
  file: File | null,
): Promise<{ path?: string; error?: string }> {
  if (!file) return {};
  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", file);
  return uploadPaymentSlip(formData);
}

export function PaymentSlipField({
  paymentMode,
  onFileChange,
}: {
  paymentMode: string;
  onFileChange: (file: File | null) => void;
}) {
  if (!slipRequiredForMode(paymentMode)) {
    return null;
  }

  const isCheque = paymentMode === "cheque";

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="slip">
        {isCheque ? "Cheque image" : "Bank transfer slip"}
        <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
      </Label>
      <Input
        id="slip"
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <p className="text-xs text-muted-foreground">
        Attach the {isCheque ? "cheque" : "transfer receipt"} — JPG, PNG, WEBP,
        or PDF, up to 10 MB.
      </p>
    </div>
  );
}
