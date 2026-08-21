"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPartyPayment } from "@/lib/actions/parties";
import { CASH_ACCOUNT_TYPE_LABELS, PAYMENT_MODE_LABELS } from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import {
  partyPaymentSchema,
  type PartyPaymentFormValues,
} from "@/lib/validations/party";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

type ContractOption = {
  id: string;
  code: string;
  title: string;
  remaining_amount: number;
};

type AccountOption = {
  id: string;
  code: string;
  name: string;
  account_type: keyof typeof CASH_ACCOUNT_TYPE_LABELS;
};

export function PartyPaymentForm({
  contracts,
  accounts,
  defaultContractId,
}: {
  contracts: ContractOption[];
  accounts: AccountOption[];
  defaultContractId?: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PartyPaymentFormValues>({
    resolver: zodResolver(partyPaymentSchema),
    defaultValues: {
      contract_id: defaultContractId ?? contracts[0]?.id ?? "",
      cash_account_id: accounts[0]?.id ?? "",
      amount: undefined,
      payment_date: format(new Date(), "yyyy-MM-dd"),
      payment_mode: "cash",
      reference_no: "",
      notes: "",
    },
  });

  const contractId = watch("contract_id");
  const contract = contracts.find((row) => row.id === contractId);

  async function onSubmit(values: PartyPaymentFormValues) {
    const result = await createPartyPayment(values);

    if (result.error || !result.partyId) {
      toast.error(result.error ?? "Could not post payment");
      return;
    }

    toast.success("Payment posted to cash book");
    router.push(`/parties/${result.partyId}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contract_id">Work order</Label>
          <select
            id="contract_id"
            className={selectClassName}
            {...register("contract_id")}
          >
            {contracts.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.title} · remaining {formatPkr(row.remaining_amount)}
              </option>
            ))}
          </select>
          {contract ? (
            <p className="text-xs text-muted-foreground">
              Remaining payable {formatPkr(contract.remaining_amount)}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (PKR)</Label>
          <Input id="amount" type="number" step="1" {...register("amount")} />
          {errors.amount ? (
            <p className="text-xs text-destructive">{String(errors.amount.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_date">Date</Label>
          <Input id="payment_date" type="date" {...register("payment_date")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cash_account_id">Pay from account</Label>
          <select
            id="cash_account_id"
            className={selectClassName}
            {...register("cash_account_id")}
          >
            {accounts.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name} ({CASH_ACCOUNT_TYPE_LABELS[row.account_type]})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_mode">Payment mode</Label>
          <select id="payment_mode" className={selectClassName} {...register("payment_mode")}>
            {Object.entries(PAYMENT_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference_no">Reference no.</Label>
          <Input id="reference_no" {...register("reference_no")} />
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
        <Button type="submit" disabled={isSubmitting || !contracts.length}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Post payment
        </Button>
      </div>
    </form>
  );
}
