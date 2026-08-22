"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
      toast.error(result.error ?? "Could not save land record");
      return;
    }

    toast.success(isEdit ? "Land record updated" : "Land record created");
    router.push(`/land-bank/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="society_id">Society</Label>
          <select id="society_id" className={selectClassName} {...register("society_id")}>
            {societies.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="acquisition_type">Acquisition type</Label>
          <select
            id="acquisition_type"
            className={selectClassName}
            {...register("acquisition_type")}
          >
            {Object.entries(LAND_ACQUISITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Land description</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="party_id">Landlord / seller</Label>
          <select id="party_id" className={selectClassName} {...register("party_id")}>
            <option value="">None</option>
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
          <Label htmlFor="status">Status</Label>
          <select id="status" className={selectClassName} {...register("status")}>
            <option value="proposed">Proposed</option>
            <option value="under_negotiation">Under negotiation</option>
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="khasra">Khasra</Label>
          <Input id="khasra" {...register("khasra")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="khewat">Khewat</Label>
          <Input id="khewat" {...register("khewat")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="khata">Khata</Label>
          <Input id="khata" {...register("khata")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mouza">Mouza</Label>
          <Input id="mouza" {...register("mouza")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Area / raqba</Label>
          <Input id="area" type="number" step="0.01" {...register("area")} />
          {errors.area ? (
            <p className="text-xs text-destructive">{String(errors.area.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="area_unit">Unit</Label>
          <select id="area_unit" className={selectClassName} {...register("area_unit")}>
            {Object.entries(AREA_UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate_per_unit">Rate per unit (PKR)</Label>
          <Input id="rate_per_unit" type="number" step="1" {...register("rate_per_unit")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase_value">Purchase value (PKR)</Label>
          <Input id="purchase_value" type="number" step="1" {...register("purchase_value")} />
          {suggested > 0 ? (
            <p className="text-xs text-muted-foreground">
              Area × rate = {formatPkr(suggested)}. Leave value at 0 to use this.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="token_amount">Token / down payment (PKR)</Label>
          <Input id="token_amount" type="number" step="1" {...register("token_amount")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="agreement_terms">Agreement terms</Label>
          <Textarea id="agreement_terms" rows={3} {...register("agreement_terms")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={2} {...register("notes")} />
        </div>
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {isEdit ? "Update land record" : "Save land record"}
        </Button>
      </div>
    </form>
  );
}
