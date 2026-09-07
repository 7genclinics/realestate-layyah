"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createLandParcel, updateLandParcel } from "@/lib/actions/land-bank";
import {
  AREA_UNIT_LABELS,
  LAND_ACQUISITION_LABELS,
} from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import {
  landParcelSchema,
  type LandParcelFormValues,
} from "@/lib/validations/land";
import {
  FormAttachments,
  uploadPendingAttachments,
  type PendingAttachment,
} from "@/components/features/form-attachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function LandParcelForm({
  societies,
  parties,
  parcelId,
  defaultValues,
}: {
  societies: { id: string; code: string; name: string }[];
  parties: { id: string; code: string; name: string }[];
  parcelId?: string;
  defaultValues?: Partial<LandParcelFormValues>;
}) {
  const router = useRouter();
  const isEdit = Boolean(parcelId);
  const t = useTranslations("land");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tAcq = useTranslations("labels.landAcquisition");
  const tUnit = useTranslations("labels.areaUnit");
  const tStatus = useTranslations("labels.landStatus");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LandParcelFormValues>({
    resolver: zodResolver(landParcelSchema),
    defaultValues: {
      society_id: societies[0]?.id ?? "",
      party_id: "",
      acquisition_type: "purchase",
      title: "",
      location: "",
      description: "",
      khasra: "",
      khewat: "",
      khata: "",
      mouza: "",
      area: undefined,
      area_unit: "kanal",
      rate_per_unit: 0,
      purchase_value: 0,
      token_amount: 0,
      status: "proposed",
      agreement_terms: "",
      notes: "",
      ...defaultValues,
    },
  });

  const area = Number(watch("area") || 0);
  const rate = Number(watch("rate_per_unit") || 0);
  const suggested = area * rate;

  async function onSubmit(values: LandParcelFormValues) {
    const result = isEdit
      ? await updateLandParcel(parcelId!, values)
      : await createLandParcel(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? tToasts("couldNotSaveLand"));
      return;
    }

    const entityLabel = isEdit ? tToasts("landUpdated") : tToasts("landCreated");

    if (attachments.length) {
      const upload = await uploadPendingAttachments(
        "land_parcel",
        result.id,
        attachments,
      );
      if (upload.failed) {
        toast.warning(
          tToasts("attachmentsFailed", {
            entity: entityLabel,
            count: upload.failed,
            suffix: upload.firstError ? `: ${upload.firstError}` : ".",
          }),
        );
      } else {
        toast.success(
          tToasts("attachmentsOk", {
            entity: entityLabel,
            count: upload.uploaded,
          }),
        );
      }
    } else {
      toast.success(entityLabel);
    }

    router.push(`/land-bank/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="society_id">{t("society")}</Label>
          <select id="society_id" className={selectClassName} {...register("society_id")}>
            {societies.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="acquisition_type">{t("acquisitionType")}</Label>
          <select
            id="acquisition_type"
            className={selectClassName}
            {...register("acquisition_type")}
          >
            {Object.keys(LAND_ACQUISITION_LABELS).map((value) => (
              <option key={value} value={value}>
                {tAcq(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">{t("landDescription")}</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="party_id">{t("landlord")}</Label>
          <select id="party_id" className={selectClassName} {...register("party_id")}>
            <option value="">{tCommon("none")}</option>
            {parties.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
          {errors.party_id ? (
            <p className="text-xs text-destructive">{errors.party_id.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{tCommon("status")}</Label>
          <select id="status" className={selectClassName} {...register("status")}>
            <option value="proposed">{tStatus("proposed")}</option>
            <option value="under_negotiation">{tStatus("under_negotiation")}</option>
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">{t("location")}</Label>
          <Input id="location" {...register("location")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="khasra">{t("khasra")}</Label>
          <Input id="khasra" {...register("khasra")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="khewat">{t("khewat")}</Label>
          <Input id="khewat" {...register("khewat")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="khata">{t("khata")}</Label>
          <Input id="khata" {...register("khata")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mouza">{t("mouza")}</Label>
          <Input id="mouza" {...register("mouza")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">{t("areaRaqba")}</Label>
          <Input id="area" type="number" step="0.01" {...register("area")} />
          {errors.area ? (
            <p className="text-xs text-destructive">{String(errors.area.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="area_unit">{tCommon("unit")}</Label>
          <select id="area_unit" className={selectClassName} {...register("area_unit")}>
            {Object.keys(AREA_UNIT_LABELS).map((value) => (
              <option key={value} value={value}>
                {tUnit(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate_per_unit">{t("ratePerUnit")}</Label>
          <Input id="rate_per_unit" type="number" step="1" {...register("rate_per_unit")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase_value">{t("purchaseValue")}</Label>
          <Input id="purchase_value" type="number" step="1" {...register("purchase_value")} />
          {suggested > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("suggested", { amount: formatPkr(suggested) })}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="token_amount">{t("tokenDown")}</Label>
          <Input id="token_amount" type="number" step="1" {...register("token_amount")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="agreement_terms">{t("agreementTerms")}</Label>
          <Textarea id="agreement_terms" rows={3} {...register("agreement_terms")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">{tCommon("notes")}</Label>
          <Textarea id="notes" rows={2} {...register("notes")} />
        </div>
      </section>

      <FormAttachments
        value={attachments}
        onChange={setAttachments}
        defaultType="title"
        disabled={isSubmitting}
        description={t("titleAttach")}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tForms("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {isEdit ? tForms("updateLand") : tForms("saveLand")}
        </Button>
      </div>
    </form>
  );
}
