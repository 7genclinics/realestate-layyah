"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createLandExchange } from "@/lib/actions/land-bank";
import { AREA_UNIT_LABELS } from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import {
  landExchangeSchema,
  type LandExchangeFormValues,
} from "@/lib/validations/land";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function LandExchangeForm({
  societies,
  parties,
  properties,
  parcels,
}: {
  societies: { id: string; code: string; name: string }[];
  parties: { id: string; code: string; name: string }[];
  properties: { id: string; code: string; plot_no: string }[];
  parcels: { id: string; code: string; title: string }[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LandExchangeFormValues>({
    resolver: zodResolver(landExchangeSchema),
    defaultValues: {
      society_id: societies[0]?.id ?? "",
      party_id: parties[0]?.id ?? "",
      outgoing_property_id: "",
      outgoing_land_id: "",
      incoming_title: "",
      incoming_location: "",
      incoming_description: "",
      incoming_area: undefined,
      incoming_area_unit: "kanal",
      incoming_khasra: "",
      incoming_khewat: "",
      incoming_khata: "",
      incoming_mouza: "",
      outgoing_value: 0,
      incoming_value: 0,
      token_amount: 0,
      agreement_terms: "",
      notes: "",
    },
  });

  const outgoingValue = Number(watch("outgoing_value") || 0);
  const incomingValue = Number(watch("incoming_value") || 0);
  const difference = incomingValue - outgoingValue;

  async function onSubmit(values: LandExchangeFormValues) {
    const result = await createLandExchange(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? "Could not create exchange");
      return;
    }

    toast.success("Exchange deal created");
    router.push(`/land-bank/exchanges/${result.id}`);
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
          <Label htmlFor="party_id">Other party</Label>
          <select id="party_id" className={selectClassName} {...register("party_id")}>
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
          <Label htmlFor="outgoing_property_id">Outgoing inventory unit</Label>
          <select
            id="outgoing_property_id"
            className={selectClassName}
            {...register("outgoing_property_id")}
          >
            <option value="">None</option>
            {properties.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.plot_no}
              </option>
            ))}
          </select>
          {errors.outgoing_property_id ? (
            <p className="text-xs text-destructive">
              {errors.outgoing_property_id.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="outgoing_land_id">Outgoing land parcel</Label>
          <select
            id="outgoing_land_id"
            className={selectClassName}
            {...register("outgoing_land_id")}
          >
            <option value="">None</option>
            {parcels.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="incoming_title">Incoming land description</Label>
          <Input id="incoming_title" {...register("incoming_title")} />
          {errors.incoming_title ? (
            <p className="text-xs text-destructive">{errors.incoming_title.message}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="incoming_location">Incoming location</Label>
          <Input id="incoming_location" {...register("incoming_location")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incoming_area">Incoming area</Label>
          <Input
            id="incoming_area"
            type="number"
            step="0.01"
            {...register("incoming_area")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incoming_area_unit">Unit</Label>
          <select
            id="incoming_area_unit"
            className={selectClassName}
            {...register("incoming_area_unit")}
          >
            {Object.entries(AREA_UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="incoming_khasra">Incoming khasra</Label>
          <Input id="incoming_khasra" {...register("incoming_khasra")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incoming_mouza">Incoming mouza</Label>
          <Input id="incoming_mouza" {...register("incoming_mouza")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outgoing_value">Outgoing valuation (PKR)</Label>
          <Input id="outgoing_value" type="number" step="1" {...register("outgoing_value")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incoming_value">Incoming valuation (PKR)</Label>
          <Input id="incoming_value" type="number" step="1" {...register("incoming_value")} />
          <p className="text-xs text-muted-foreground">
            Difference {formatPkr(difference)}{" "}
            {difference > 0 ? "(society pays)" : difference < 0 ? "(society receives)" : ""}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="token_amount">Token (PKR)</Label>
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
          Save exchange
        </Button>
      </div>
    </form>
  );
}
