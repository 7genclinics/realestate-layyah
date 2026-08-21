"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createParty } from "@/lib/actions/parties";
import { PARTY_STATUS_LABELS, PARTY_TYPE_LABELS } from "@/lib/constants";
import { partySchema, type PartyFormValues } from "@/lib/validations/party";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function PartyForm({ canEditBank }: { canEditBank: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: "",
      party_type: "contractor",
      phone: "",
      phone_secondary: "",
      address: "",
      id_number: "",
      opening_balance: 0,
      status: "active",
      notes: "",
      bank_name: "",
      account_title: "",
      account_no: "",
      iban: "",
    },
  });

  async function onSubmit(values: PartyFormValues) {
    const result = await createParty(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? "Could not create party");
      return;
    }

    toast.success("Party created");
    router.push(`/parties/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="party_type">Type</Label>
          <select id="party_type" className={selectClassName} {...register("party_type")}>
            {Object.entries(PARTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" className={selectClassName} {...register("status")}>
            {Object.entries(PARTY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
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
          <Label htmlFor="id_number">CNIC / NTN</Label>
          <Input id="id_number" {...register("id_number")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="opening_balance">Opening balance (PKR)</Label>
          <Input id="opening_balance" type="number" step="1" {...register("opening_balance")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
        </div>
        {canEditBank ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank name</Label>
              <Input id="bank_name" {...register("bank_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_title">Account title</Label>
              <Input id="account_title" {...register("account_title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_no">Account no.</Label>
              <Input id="account_no" {...register("account_no")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" {...register("iban")} />
            </div>
          </>
        ) : null}
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
          Save party
        </Button>
      </div>
    </form>
  );
}
