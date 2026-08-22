"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { receivePayment } from "@/lib/actions/receipts";
import { amountToWords } from "@/lib/amount-to-words";
import { PAYMENT_MODE_LABELS } from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import { roundMoney } from "@/lib/installments";
import {
  receivePaymentSchema,
  type ReceivePaymentFormValues,
} from "@/lib/validations/receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PaymentSlipField,
  slipRequiredForMode,
  uploadSlipFile,
} from "@/components/features/payment-slip-field";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

type SaleOption = {
  id: string;
  code: string;
  plot_no: string;
  remaining_amount: number;
  customer_id: string;
  customers: { full_name: string; code: string } | { full_name: string; code: string }[] | null;
};

type InstallmentOption = {
  id: string;
  sale_id: string;
  installment_no: number;
  period_label: string;
  scheduled_amount: number;
  received_amount: number;
};

type AccountOption = {
  id: string;
  code: string;
  name: string;
  account_type: string;
};

export function ReceivePaymentForm({
  sales,
  installments,
  accounts,
  defaultSaleId,
  defaultInstallmentId,
}: {
  sales: SaleOption[];
  installments: InstallmentOption[];
  accounts: AccountOption[];
  defaultSaleId?: string;
  defaultInstallmentId?: string;
}) {
  const router = useRouter();
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<ReceivePaymentFormValues>({
    resolver: zodResolver(receivePaymentSchema),
    defaultValues: {
      sale_id: defaultSaleId ?? sales[0]?.id ?? "",
      installment_id: defaultInstallmentId ?? "",
      cash_account_id: accounts[0]?.id ?? "",
      amount: undefined,
      payment_date: format(new Date(), "yyyy-MM-dd"),
      payment_mode: "cash",
      reference_no: "",
      notes: "",
    },
  });

  const saleId = watch("sale_id");
  const installmentId = watch("installment_id");
  const paymentMode = watch("payment_mode");
  const amount = Number(watch("amount") || 0);

  // "custom" = the collector types any partial amount by hand; it is applied to
  // the oldest open EMI first and the remainder carries to the next one.
  const isCustom = installmentId === "custom";
  const sale = sales.find((item) => item.id === saleId);
  const openInstallments = installments.filter((row) => row.sale_id === saleId);
  const selectedInstallment = openInstallments.find((row) => row.id === installmentId);
  const defaultAmount = isCustom
    ? 0
    : selectedInstallment
      ? roundMoney(
          Number(selectedInstallment.scheduled_amount) -
            Number(selectedInstallment.received_amount),
        )
      : sale
        ? Number(sale.remaining_amount)
        : 0;

  useEffect(() => {
    if (isCustom) {
      // Clear the pre-filled balance so the user enters the partial amount.
      resetField("amount");
      return;
    }
    if (defaultAmount > 0) {
      setValue("amount", defaultAmount);
    }
  }, [defaultAmount, isCustom, setValue, resetField, saleId, installmentId]);

  const amountWords = amount > 0 ? amountToWords(amount) : "";

  async function onSubmit(values: ReceivePaymentFormValues) {
    // A stale slip may linger in state if the collector picked a file then
    // switched back to cash — only send it for slip-bearing modes.
    const upload = slipRequiredForMode(values.payment_mode)
      ? await uploadSlipFile("receipt", slipFile)
      : {};

    if (upload.error) {
      toast.error(upload.error);
      return;
    }

    const result = await receivePayment({ ...values, slip_path: upload.path });

    if (result.error || !result.id) {
      toast.error(result.error ?? "Could not post payment");
      return;
    }

    toast.success("Payment received");
    router.push(`/receipts/${result.id}/print`);
    router.refresh();
  }

  const customer = sale?.customers
    ? Array.isArray(sale.customers)
      ? sale.customers[0]
      : sale.customers
    : null;

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sale_id">Sale / booking</Label>
          <select id="sale_id" className={selectClassName} {...register("sale_id")}>
            {sales.map((item) => {
              const rowCustomer = item.customers
                ? Array.isArray(item.customers)
                  ? item.customers[0]
                  : item.customers
                : null;

              return (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.plot_no} · {rowCustomer?.full_name ?? "Customer"}
                </option>
              );
            })}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="installment_id">Apply to installment</Label>
          <select
            id="installment_id"
            className={selectClassName}
            {...register("installment_id")}
          >
            <option value="">Auto-allocate oldest open EMI</option>
            <option value="custom">Custom / partial amount</option>
            {openInstallments.map((row) => {
              const open = roundMoney(
                Number(row.scheduled_amount) - Number(row.received_amount),
              );

              return (
                <option key={row.id} value={row.id} disabled={open <= 0}>
                  #{row.installment_no} {row.period_label} · open {formatPkr(open)}
                </option>
              );
            })}
          </select>
        </div>
        {sale ? (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            {customer?.full_name} · remaining balance{" "}
            <span className="font-medium text-foreground">
              {formatPkr(sale.remaining_amount)}
            </span>
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="amount">Receiving amount (PKR)</Label>
          <Input id="amount" type="number" step="1" {...register("amount")} />
          {errors.amount ? (
            <p className="text-xs text-destructive">{String(errors.amount.message)}</p>
          ) : null}
          {isCustom ? (
            <p className="text-xs text-muted-foreground">
              Partial payment — enter any amount the customer is paying now. It
              clears the oldest open installment first and the remainder carries
              to the next one automatically.
            </p>
          ) : null}
          {amountWords ? (
            <p className="text-xs text-muted-foreground">{amountWords}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_date">Payment date</Label>
          <Input id="payment_date" type="date" {...register("payment_date")} />
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
          <Label htmlFor="cash_account_id">Deposit to account</Label>
          <select
            id="cash_account_id"
            className={selectClassName}
            {...register("cash_account_id")}
          >
            {accounts.length ? (
              accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} · {account.name}
                </option>
              ))
            ) : (
              <option value="">No cash accounts — create one first</option>
            )}
          </select>
          {errors.cash_account_id ? (
            <p className="text-xs text-destructive">
              {String(errors.cash_account_id.message)}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference_no">Reference / cheque no.</Label>
          <Input id="reference_no" {...register("reference_no")} />
        </div>
        <PaymentSlipField
          paymentMode={paymentMode}
          onFileChange={setSlipFile}
        />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={2} {...register("notes")} />
        </div>
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !sales.length || !accounts.length}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Post payment & print receipt
        </Button>
      </div>
    </form>
  );
}
