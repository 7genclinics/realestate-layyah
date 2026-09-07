"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createCashVoucher } from "@/lib/actions/cash-book";
import {
  CASH_ACCOUNT_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
} from "@/lib/constants";
import {
  cashVoucherSchema,
  type CashVoucherFormValues,
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

type CategoryOption = {
  id: string;
  name: string;
  group_name: string | null;
  category_type: "income" | "expense";
};

type SocietyOption = {
  id: string;
  name: string;
  code: string;
};

export function CashVoucherForm({
  accounts,
  categories,
  societies,
  defaultType = "expense",
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  societies: SocietyOption[];
  defaultType?: "income" | "expense";
}) {
  const router = useRouter();
  const t = useTranslations("cash");
  const tPay = useTranslations("payments");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tAccount = useTranslations("labels.cashAccountType");
  const tMode = useTranslations("labels.paymentMode");
  const tTxn = useTranslations("labels.cashTransactionType");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CashVoucherFormValues>({
    resolver: zodResolver(cashVoucherSchema),
    defaultValues: {
      transaction_type: defaultType,
      category_id: "",
      cash_account_id: accounts[0]?.id ?? "",
      society_id: "",
      amount: undefined,
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      payment_mode: "cash",
      description: "",
      reference_no: "",
      counterparty_name: "",
      notes: "",
    },
  });

  const transactionType = watch("transaction_type");
  const filteredCategories = categories.filter(
    (row) => row.category_type === transactionType,
  );

  async function onSubmit(values: CashVoucherFormValues) {
    const result = await createCashVoucher(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? tToasts("couldNotPostVoucher"));
      return;
    }

    toast.success(tToasts("voucherPosted"));
    router.push(`/cash-book/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transaction_type">{tCommon("type")}</Label>
          <select
            id="transaction_type"
            className={selectClassName}
            {...register("transaction_type")}
          >
            <option value="income">{tTxn("income")}</option>
            <option value="expense">{tTxn("expense")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category_id">{t("category")}</Label>
          <select
            id="category_id"
            className={selectClassName}
            {...register("category_id")}
          >
            <option value="">{t("selectCategory")}</option>
            {filteredCategories.map((row) => (
              <option key={row.id} value={row.id}>
                {row.group_name ? `${row.group_name} · ` : ""}
                {row.name}
              </option>
            ))}
          </select>
          {errors.category_id ? (
            <p className="text-xs text-destructive">
              {String(errors.category_id.message)}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cash_account_id">{t("cashBankAccount")}</Label>
          <select
            id="cash_account_id"
            className={selectClassName}
            {...register("cash_account_id")}
          >
            {accounts.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name} (
                {tAccount(row.account_type)})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="society_id">{t("projectSociety")}</Label>
          <select id="society_id" className={selectClassName} {...register("society_id")}>
            <option value="">{t("allNotLinked")}</option>
            {societies.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
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
        <div className="space-y-2">
          <Label htmlFor="payment_mode">{tPay("paymentMode")}</Label>
          <select id="payment_mode" className={selectClassName} {...register("payment_mode")}>
            {Object.keys(PAYMENT_MODE_LABELS).map((value) => (
              <option key={value} value={value}>
                {tMode(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="counterparty_name">{t("payeePayer")}</Label>
          <Input id="counterparty_name" {...register("counterparty_name")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{tCommon("description")}</Label>
          <Input id="description" {...register("description")} />
          {errors.description ? (
            <p className="text-xs text-destructive">
              {String(errors.description.message)}
            </p>
          ) : null}
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
        <Button type="submit" disabled={isSubmitting || !accounts.length}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {tForms("postVoucher")}
        </Button>
      </div>
    </form>
  );
}
