"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createCashTransfer } from "@/lib/actions/cash-book";
import { CASH_ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import {
  cashTransferSchema,
  type CashTransferFormValues,
} from "@/lib/validations/cash-book";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

type AccountOption = {
  id: string;
  code: string;
  name: string;
  account_type: keyof typeof CASH_ACCOUNT_TYPE_LABELS;
};

export function CashTransferForm({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const t = useTranslations("cash");
  const tPay = useTranslations("payments");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CashTransferFormValues>({
    resolver: zodResolver(cashTransferSchema),
    defaultValues: {
      from_account_id: accounts[0]?.id ?? "",
      to_account_id: accounts[1]?.id ?? accounts[0]?.id ?? "",
      amount: undefined,
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      description: t("defaultTransferDesc"),
      reference_no: "",
      notes: "",
    },
  });

  async function onSubmit(values: CashTransferFormValues) {
    const result = await createCashTransfer(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? tToasts("couldNotPostTransfer"));
      return;
    }

    toast.success(tToasts("transferPosted"));
    router.push("/cash-book");
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="from_account_id">{t("fromAccount")}</Label>
          <select
            id="from_account_id"
            className={selectClassName}
            {...register("from_account_id")}
          >
            {accounts.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="to_account_id">{t("toAccount")}</Label>
          <select
            id="to_account_id"
            className={selectClassName}
            {...register("to_account_id")}
          >
            {accounts.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
          {errors.to_account_id ? (
            <p className="text-xs text-destructive">
              {String(errors.to_account_id.message)}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">{tPay("amountPkr")}</Label>
          <Input id="amount" type="number" step="1" {...register("amount")} />
          {errors.amount ? (
            <p className="text-xs text-destructive">{String(errors.amount.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="transaction_date">{tCommon("date")}</Label>
          <Input
            id="transaction_date"
            type="date"
            {...register("transaction_date")}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{tCommon("description")}</Label>
          <Input id="description" {...register("description")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference_no">{tPay("referenceNo")}</Label>
          <Input id="reference_no" {...register("reference_no")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">{tCommon("notes")}</Label>
          <Textarea id="notes" rows={2} {...register("notes")} />
        </div>
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tForms("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting || accounts.length < 2}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {tForms("postTransfer")}
        </Button>
      </div>
    </form>
  );
}
