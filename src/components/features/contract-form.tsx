"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createContract } from "@/lib/actions/parties";
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_UNIT_LABELS,
} from "@/lib/constants";
import { roundMoney } from "@/lib/installments";
import { contractSchema, type ContractFormValues } from "@/lib/validations/party";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

type PartyOption = { id: string; code: string; name: string };
type SocietyOption = { id: string; code: string; name: string };

export function ContractForm({
  parties,
  societies,
  defaultPartyId,
}: {
  parties: PartyOption[];
  societies: SocietyOption[];
  defaultPartyId?: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      party_id: defaultPartyId ?? parties[0]?.id ?? "",
      society_id: "",
      contract_type: "other",
      title: "",
      start_date: "",
      end_date: "",
      unit: "lump_sum",
      rate: undefined,
      quantity: 1,
      contract_value: undefined,
      retention_amount: 0,
      notes: "",
    },
  });

  const rate = Number(watch("rate") || 0);
  const quantity = Number(watch("quantity") || 0);

  useEffect(() => {
    if (rate > 0 && quantity > 0) {
      setValue("contract_value", roundMoney(rate * quantity));
    }
  }, [rate, quantity, setValue]);

  async function onSubmit(values: ContractFormValues) {
    const result = await createContract(values);

    if (result.error || !result.id || !result.partyId) {
      toast.error(result.error ?? "Could not create work order");
      return;
    }

    toast.success("Work order created");
    router.push(`/parties/${result.partyId}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="party_id">Party</Label>
          <select id="party_id" className={selectClassName} {...register("party_id")}>
            {parties.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="society_id">Project / society</Label>
          <select id="society_id" className={selectClassName} {...register("society_id")}>
            <option value="">Not linked</option>
            {societies.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract_type">Work type</Label>
          <select
            id="contract_type"
            className={selectClassName}
            {...register("contract_type")}
          >
            {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <select id="unit" className={selectClassName} {...register("unit")}>
            {Object.entries(CONTRACT_UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate">Rate (PKR)</Label>
          <Input id="rate" type="number" step="1" {...register("rate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity / measurement</Label>
          <Input id="quantity" type="number" step="0.01" {...register("quantity")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract_value">Contract value (PKR)</Label>
          <Input id="contract_value" type="number" step="1" {...register("contract_value")} />
          {errors.contract_value ? (
            <p className="text-xs text-destructive">
              {String(errors.contract_value.message)}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="retention_amount">Retention (PKR)</Label>
          <Input
            id="retention_amount"
            type="number"
            step="1"
            {...register("retention_amount")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" type="date" {...register("start_date")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End date</Label>
          <Input id="end_date" type="date" {...register("end_date")} />
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
        <Button type="submit" disabled={isSubmitting || !parties.length}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Save work order
        </Button>
      </div>
    </form>
  );
}
