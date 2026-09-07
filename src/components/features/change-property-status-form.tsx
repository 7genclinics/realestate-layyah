"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { changePropertyStatus } from "@/lib/actions/properties";
import { PROPERTY_STATUS_TRANSITIONS } from "@/lib/constants";
import type { PropertyStatus } from "@/lib/database.types";
import {
  propertyStatusSchema,
  type PropertyStatusFormValues,
} from "@/lib/validations/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function ChangePropertyStatusForm({
  propertyId,
  currentStatus,
}: {
  propertyId: string;
  currentStatus: PropertyStatus;
}) {
  const t = useTranslations("inventory");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tStatus = useTranslations("labels.propertyStatus");
  const nextStatuses = PROPERTY_STATUS_TRANSITIONS[currentStatus];
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PropertyStatusFormValues>({
    resolver: zodResolver(propertyStatusSchema),
    defaultValues: {
      property_id: propertyId,
      status: nextStatuses[0],
      reason: "",
      hold_until: "",
      hold_party_name: "",
    },
  });

  const nextStatus = watch("status");

  if (nextStatuses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("transferredLocked")}
      </p>
    );
  }

  async function onSubmit(values: PropertyStatusFormValues) {
    const result = await changePropertyStatus(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(tToasts("statusUpdated"));
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register("property_id")} />
      <div className="space-y-2">
        <Label htmlFor="status">{t("newStatus")}</Label>
        <select id="status" className={selectClassName} {...register("status")}>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {tStatus(status)}
            </option>
          ))}
        </select>
      </div>
      {nextStatus === "hold" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="hold_party_name">{t("heldFor")}</Label>
            <Input
              id="hold_party_name"
              placeholder={t("heldPlaceholder")}
              {...register("hold_party_name")}
            />
            {errors.hold_party_name ? (
              <p className="text-xs text-destructive">
                {errors.hold_party_name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hold_until">{t("holdExpiry")}</Label>
            <Input id="hold_until" type="date" {...register("hold_until")} />
          </div>
        </>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="reason">{t("reason")}</Label>
        <Input id="reason" placeholder={t("reasonPlaceholder")} {...register("reason")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : null}
        {tForms("updateStatus")}
      </Button>
    </form>
  );
}
