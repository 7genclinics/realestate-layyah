"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCustomer } from "@/lib/actions/customers";
import {
  CUSTOMER_RELATION_LABELS,
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STAGE_LABELS,
  ID_TYPE_LABELS,
} from "@/lib/constants";
import {
  customerSchema,
  type CustomerFormValues,
} from "@/lib/validations/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function CustomerForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: "",
      relation: "s_o",
      guardian_name: "",
      caste: "",
      id_type: "cnic",
      id_number: "",
      phone: "",
      phone_secondary: "",
      address: "",
      source: "walk_in",
      stage: "lead",
      notes: "",
    },
  });

  async function onSubmit(values: CustomerFormValues) {
    const result = await createCustomer(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? "Could not create customer");
      return;
    }

    toast.success("Customer created");
    router.push(`/customers/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...register("full_name")} />
          {errors.full_name ? (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="relation">Relation</Label>
          <select id="relation" className={selectClassName} {...register("relation")}>
            {Object.entries(CUSTOMER_RELATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardian_name">Guardian name</Label>
          <Input id="guardian_name" {...register("guardian_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_type">ID type</Label>
          <select id="id_type" className={selectClassName} {...register("id_type")}>
            {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_number">CNIC / passport</Label>
          <Input id="id_number" {...register("id_number")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Primary phone</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone ? (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_secondary">Secondary phone</Label>
          <Input id="phone_secondary" {...register("phone_secondary")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <select id="source" className={selectClassName} {...register("source")}>
            {Object.entries(CUSTOMER_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <select id="stage" className={selectClassName} {...register("stage")}>
            {Object.entries(CUSTOMER_STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="caste">Caste</Label>
          <Input id="caste" {...register("caste")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" rows={2} {...register("address")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} {...register("notes")} />
        </div>
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Save customer
        </Button>
      </div>
    </form>
  );
}
