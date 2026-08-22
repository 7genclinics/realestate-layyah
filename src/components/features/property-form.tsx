"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
      toast.error(result.error ?? "Could not save property");
      return;
    }

    if (attachments.length) {
      const upload = await uploadPendingAttachments(
        "property",
        result.id,
        attachments,
      );
      if (upload.failed) {
        toast.warning(
          `Property saved, but ${upload.failed} attachment${upload.failed > 1 ? "s" : ""} failed to upload${upload.firstError ? `: ${upload.firstError}` : "."}`,
        );
      } else {
        toast.success(
          `${isEdit ? "Property updated" : "Property added to inventory"} · ${upload.uploaded} document${upload.uploaded > 1 ? "s" : ""} attached`,
        );
      }
    } else {
      toast.success(isEdit ? "Property updated" : "Property added to inventory");
    }

    router.push(`/inventory/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="society_id">Society / project</Label>
          <select id="society_id" className={selectClassName} {...register("society_id")}>
            <option value="">Select society</option>
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
          <Label htmlFor="block_id">Block / phase</Label>
          <select id="block_id" className={selectClassName} {...register("block_id")}>
            <option value="">None</option>
            {societyBlocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="new_block_name">Or create a new block</Label>
          <Input id="new_block_name" placeholder="Block A" {...register("new_block_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_type">Property type</Label>
          <select
            id="property_type"
            className={selectClassName}
            {...register("property_type")}
          >
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plot_no">Plot / shop no.</Label>
          <Input id="plot_no" placeholder="A-12" {...register("plot_no")} />
          {errors.plot_no ? (
            <p className="text-xs text-destructive">{errors.plot_no.message}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="length_ft">Length (ft)</Label>
          <Input id="length_ft" type="number" step="0.01" {...register("length_ft")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width_ft">Width (ft)</Label>
          <Input id="width_ft" type="number" step="0.01" {...register("width_ft")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Total area</Label>
          <Input id="area" type="number" step="0.01" {...register("area")} />
          {errors.area ? (
            <p className="text-xs text-destructive">{String(errors.area.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="area_unit">Area unit</Label>
          <select id="area_unit" className={selectClassName} {...register("area_unit")}>
            {Object.entries(AREA_UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="facing">Facing / location</Label>
          <Input id="facing" placeholder="Park facing" {...register("facing")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="street_width_ft">Street width (ft)</Label>
          <Input
            id="street_width_ft"
            type="number"
            step="0.01"
            {...register("street_width_ft")}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="attributes">Tags</Label>
          <Input
            id="attributes"
            placeholder="corner, main road"
            {...register("attributes")}
          />
          <p className="text-xs text-muted-foreground">Comma-separated attributes</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="ownership_source">Ownership source</Label>
          <select
            id="ownership_source"
            className={selectClassName}
            {...register("ownership_source")}
          >
            {Object.entries(OWNERSHIP_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="asking_price">Asking / sale price (PKR)</Label>
          <Input id="asking_price" type="number" step="1" {...register("asking_price")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_rent">Monthly rent (PKR)</Label>
          <Input id="monthly_rent" type="number" step="1" {...register("monthly_rent")} />
        </div>
        {showCosts ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="acquisition_cost">Acquisition cost (internal)</Label>
              <Input
                id="acquisition_cost"
                type="number"
                step="1"
                {...register("acquisition_cost")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_approved_price">Minimum approved price</Label>
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
          Visible to agents
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="internal_notes">Internal notes</Label>
          <Textarea id="internal_notes" rows={3} {...register("internal_notes")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent_notes">Agent-visible notes</Label>
          <Textarea id="agent_notes" rows={3} {...register("agent_notes")} />
        </div>
      </section>

      <FormAttachments
        value={attachments}
        onChange={setAttachments}
        defaultType="title"
        disabled={isSubmitting}
        description="Attach the title deed, site plan or other files (JPG, PNG, PDF · max 10 MB)."
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {isEdit ? "Update property" : "Save property"}
        </Button>
      </div>
    </form>
  );
}
