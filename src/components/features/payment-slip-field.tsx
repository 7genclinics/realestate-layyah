"use client";

import { uploadPaymentSlip } from "@/lib/actions/payment-slips";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SLIP_MODES = new Set(["bank_transfer", "cheque"]);

export function slipRequiredForMode(mode: string) {
  return SLIP_MODES.has(mode);
}

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
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");

  if (!slipRequiredForMode(paymentMode)) {
    return null;
  }

  const isCheque = paymentMode === "cheque";

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="slip">
        {isCheque ? t("chequeImage") : t("bankSlip")}
        <span className="ml-1 font-normal text-muted-foreground">({tCommon("optional")})</span>
      </Label>
      <Input
        id="slip"
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <p className="text-xs text-muted-foreground">
        {isCheque ? t("slipHintCheque") : t("slipHintBank")}
      </p>
    </div>
  );
}
