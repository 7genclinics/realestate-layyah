"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createProperty, updateProperty } from "@/lib/actions/properties";
import {
  AREA_UNIT_LABELS,
  OWNERSHIP_SOURCE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { canViewPropertyCosts } from "@/lib/permissions";
import type { AppRole, Society, SocietyBlock } from "@/lib/database.types";
import {
  propertySchema,
  type PropertyFormValues,
} from "@/lib/validations/property";
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

export function PropertyForm({
  societies,
  blocks,
  role,
  propertyId,
  defaultValues,
}: {
  societies: Pick<Society, "id" | "code" | "name">[];
  blocks: Pick<SocietyBlock, "id" | "name" | "society_id">[];
  role: AppRole;
  propertyId?: string;
  defaultValues?: Partial<PropertyFormValues>;
}) {
  const router = useRouter();
  const isEdit = Boolean(propertyId);
  const t = useTranslations("inventory");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tType = useTranslations("labels.propertyType");
  const tUnit = useTranslations("labels.areaUnit");
  const tOwn = useTranslations("labels.ownershipSource");
  const showCosts = canViewPropertyCosts(role);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      society_id: societies[0]?.id ?? "",
      block_id: "",
      new_block_name: "",
      property_type: "residential_plot",
      plot_no: "",
      area: undefined,
      area_unit: "marla",
      ownership_source: "society_owned",
      agent_visible: false,
      ...defaultValues,
    },
  });

  const societyId = watch("society_id");
  const societyBlocks = blocks.filter((block) => block.society_id === societyId);

  async function onSubmit(values: PropertyFormValues) {
    const result = isEdit
      ? await updateProperty(propertyId!, values)
      : await createProperty(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? tToasts("couldNotSaveProperty"));
      return;
    }

    const entityLabel = isEdit ? tToasts("propertyUpdated") : tToasts("propertyAdded");

    if (attachments.length) {
      const upload = await uploadPendingAttachments(
        "property",
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

    router.push(`/inventory/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="society_id">{t("societyProject")}</Label>
          <select id="society_id" className={selectClassName} {...register("society_id")}>
            <option value="">{t("selectSociety")}</option>
            {societies.map((society) => (
              <option key={society.id} value={society.id}>
                {society.code} · {society.name}
              </option>
            ))}
          </select>
          {errors.society_id ? (
            <p className="text-xs text-destructive">{errors.society_id.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="block_id">{t("blockPhase")}</Label>
          <select id="block_id" className={selectClassName} {...register("block_id")}>
            <option value="">{tCommon("none")}</option>
            {societyBlocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="new_block_name">{t("newBlock")}</Label>
          <Input id="new_block_name" placeholder={t("newBlockPlaceholder")} {...register("new_block_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_type">{t("propertyType")}</Label>
          <select
            id="property_type"
            className={selectClassName}
            {...register("property_type")}
          >
            {Object.keys(PROPERTY_TYPE_LABELS).map((value) => (
              <option key={value} value={value}>
                {tType(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plot_no">{t("plotShopNo")}</Label>
          <Input id="plot_no" placeholder="A-12" {...register("plot_no")} />
          {errors.plot_no ? (
            <p className="text-xs text-destructive">{errors.plot_no.message}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="length_ft">{t("lengthFt")}</Label>
          <Input id="length_ft" type="number" step="0.01" {...register("length_ft")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width_ft">{t("widthFt")}</Label>
          <Input id="width_ft" type="number" step="0.01" {...register("width_ft")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">{t("totalArea")}</Label>
          <Input id="area" type="number" step="0.01" {...register("area")} />
          {errors.area ? (
            <p className="text-xs text-destructive">{String(errors.area.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="area_unit">{t("areaUnit")}</Label>
          <select id="area_unit" className={selectClassName} {...register("area_unit")}>
            {Object.keys(AREA_UNIT_LABELS).map((value) => (
              <option key={value} value={value}>
                {tUnit(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="facing">{t("facing")}</Label>
          <Input id="facing" placeholder={t("facingPlaceholder")} {...register("facing")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="street_width_ft">{t("streetWidth")}</Label>
          <Input
            id="street_width_ft"
            type="number"
            step="0.01"
            {...register("street_width_ft")}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="attributes">{t("tags")}</Label>
          <Input
            id="attributes"
            placeholder={t("tagsPlaceholder")}
            {...register("attributes")}
          />
          <p className="text-xs text-muted-foreground">{t("tagsHint")}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="ownership_source">{t("ownershipSource")}</Label>
          <select
            id="ownership_source"
            className={selectClassName}
            {...register("ownership_source")}
          >
            {Object.keys(OWNERSHIP_SOURCE_LABELS).map((value) => (
              <option key={value} value={value}>
                {tOwn(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="asking_price">{t("askingPrice")}</Label>
          <Input id="asking_price" type="number" step="1" {...register("asking_price")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_rent">{t("monthlyRent")}</Label>
          <Input id="monthly_rent" type="number" step="1" {...register("monthly_rent")} />
        </div>
        {showCosts ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="acquisition_cost">{t("acquisitionCost")}</Label>
              <Input
                id="acquisition_cost"
                type="number"
                step="1"
                {...register("acquisition_cost")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_approved_price">{t("minPrice")}</Label>
              <Input
                id="min_approved_price"
                type="number"
                step="1"
                {...register("min_approved_price")}
              />
            </div>
          </>
        ) : null}
        <label className="flex items-center gap-2 text-sm sm:mt-7">
          <input type="checkbox" {...register("agent_visible")} />
          {t("agentVisible")}
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="internal_notes">{t("internalNotes")}</Label>
          <Textarea id="internal_notes" rows={3} {...register("internal_notes")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent_notes">{t("agentNotes")}</Label>
          <Textarea id="agent_notes" rows={3} {...register("agent_notes")} />
        </div>
      </section>

      <FormAttachments
        value={attachments}
        onChange={setAttachments}
        defaultType="title"
        disabled={isSubmitting}
        description={t("attachHint")}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tForms("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {isEdit ? tForms("updateProperty") : tForms("saveProperty")}
        </Button>
      </div>
    </form>
  );
}
