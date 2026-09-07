import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import type { CashAccountType } from "@/lib/database.types";
import { transactionSignedAmount } from "@/lib/cash-book";
import { createClient } from "@/lib/server";
import {
  CASH_ACCOUNT_TYPE_LABELS,
  CASH_TRANSACTION_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
} from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CashTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("pages.cashBook");
  const tAcct = await getTranslations("labels.cashAccountType");
  const tTx = await getTranslations("labels.cashTransactionType");
  const tPay = await getTranslations("labels.paymentMode");
  const tCommon = await getTranslations("common");

  const { data: row, error } = await supabase
    .from("cash_transactions")
    .select(
      `
      id,
      code,
      transaction_date,
      transaction_type,
      transfer_side,
      amount,
      description,
      reference_no,
      notes,
      counterparty_name,
      payment_mode,
      receipt_id,
      status,
      cash_accounts(code, name, account_type),
      cash_categories(name, group_name),
      societies(name, code),
      profiles:entered_by(full_name),
      receipts(code)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  const account = Array.isArray(row.cash_accounts)
    ? row.cash_accounts[0]
    : row.cash_accounts;
  const category = Array.isArray(row.cash_categories)
    ? row.cash_categories[0]
    : row.cash_categories;
  const society = Array.isArray(row.societies) ? row.societies[0] : row.societies;
  const enteredBy = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const receipt = Array.isArray(row.receipts) ? row.receipts[0] : row.receipts;

  const signed = transactionSignedAmount({
    transaction_type: row.transaction_type,
    transfer_side: row.transfer_side,
    amount: Number(row.amount),
    status: row.status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{row.code}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("voucherTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(row.transaction_date, locale)} ·{" "}
            {tTx(row.transaction_type as keyof typeof CASH_TRANSACTION_TYPE_LABELS)}
          </p>
        </div>
        <Button render={<Link href="/cash-book" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{formatPkr(Math.abs(signed), locale)}</CardTitle>
          <CardDescription>
            {t("onAccount", {
              direction: signed >= 0 ? t("inflow") : t("outflow"),
              account: account?.name ?? t("accountFallback"),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label={t("accountLabel")}>
            {account
              ? t("accountLine", {
                  code: account.code,
                  name: account.name,
                  type: tAcct(account.account_type as CashAccountType),
                })
              : tCommon("dash")}
          </Detail>
          <Detail label={t("category")}>{category?.name ?? tCommon("dash")}</Detail>
          <Detail label={t("project")}>{society?.name ?? tCommon("dash")}</Detail>
          <Detail label={t("paymentMode")}>
            {row.payment_mode
              ? tPay(row.payment_mode as keyof typeof PAYMENT_MODE_LABELS)
              : tCommon("dash")}
          </Detail>
          <Detail label={t("payeePayer")}>{row.counterparty_name || tCommon("dash")}</Detail>
          <Detail label={tCommon("reference")}>{row.reference_no || tCommon("dash")}</Detail>
          <Detail label={t("enteredBy")}>{enteredBy?.full_name ?? tCommon("dash")}</Detail>
          <Detail label={tCommon("status")}>
            <Badge variant="secondary">{row.status}</Badge>
          </Detail>
          <Detail label={tCommon("description")}>{row.description}</Detail>
          <Detail label={tCommon("notes")}>{row.notes || tCommon("dash")}</Detail>
          {receipt ? (
            <Detail label={t("linkedReceiptLabel")}>
              <Link
                href={`/receipts/${row.receipt_id}`}
                className="underline-offset-4 hover:underline"
              >
                {receipt.code}
              </Link>
            </Detail>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
