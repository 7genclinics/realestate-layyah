"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  addLandToInventory,
  approveLandExchange,
  approveLandParcel,
  completeLandExchange,
} from "@/lib/actions/land-bank";
import { Button } from "@/components/ui/button";

export function LandActionButton({
  action,
  id,
  label,
  variant = "default",
}: {
  action: "approve-parcel" | "add-inventory" | "approve-exchange" | "complete-exchange";
  id: string;
  label: string;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    const result =
      action === "approve-parcel"
        ? await approveLandParcel(id)
        : action === "add-inventory"
          ? await addLandToInventory(id)
          : action === "approve-exchange"
            ? await approveLandExchange(id)
            : await completeLandExchange(id);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      action === "add-inventory"
        ? tToasts("addedToInventory")
        : action === "complete-exchange"
          ? tToasts("exchangeCompleted")
          : tCommon("approved"),
    );

    if (action === "add-inventory" && "propertyId" in result && result.propertyId) {
      router.push(`/inventory/${result.propertyId}`);
    } else if (action === "complete-exchange" && "landId" in result && result.landId) {
      router.push(`/land-bank/${result.landId}`);
    } else {
      router.refresh();
    }
  }

  return (
    <Button type="button" variant={variant} onClick={run} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {label}
    </Button>
  );
}
