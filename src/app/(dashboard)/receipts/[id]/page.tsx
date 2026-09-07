import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { PAYMENT_MODE_LABELS } from "@/lib/constants";
import { formatDate, formatPkr } from "@/lib/format";
import { ReceiptPrintView } from "@/components/features/receipt-print-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("pages.receipts");
  const tPay = await getTranslations("labels.paymentMode");
  const tCommon = await getTranslations("common");

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select(
      `
      id,
      code,
      payment_date,
      amount,
      amount_in_words,
      payment_mode,
      reference_no,
      notes,
      customers(full_name, code, phone, address, relation, guardian_name),
      sales(code, plot_no, remaining_amount),
      profiles:received_by(full_name),
      receipt_allocations(
        allocated_amount,
        installments(installment_no, period_label)
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !receipt) {
    notFound();
  }

  const customer = Array.isArray(receipt.customers)
    ? receipt.customers[0]
    : receipt.customers;
  const sale = Array.isArray(receipt.sales) ? receipt.sales[0] : receipt.sales;
  const receivedBy = Array.isArray(receipt.profiles)
    ? receipt.profiles[0]
    : receipt.profiles;

  if (!customer || !sale) {
    notFound();
  }

  const allocations = (receipt.receipt_allocations ?? []).map((row) => {
    const installment = Array.isArray(row.installments)
      ? row.installments[0]
      : row.installments;

    return {
      allocated_amount: Number(row.allocated_amount),
      installment_no: installment?.installment_no ?? 0,
      period_label: installment?.period_label ?? "—",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{receipt.code}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("receiptTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(receipt.payment_date, locale)} · {formatPkr(receipt.amount, locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href={`/receipts/${id}/print`} />}>{tCommon("print")}</Button>
          <Button render={<Link href="/receipts" />} variant="outline">
            {tCommon("back")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("summary")}</CardTitle>
          <CardDescription>
            {customer.full_name} · {sale.plot_no}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("paymentMode")}</p>
            <Badge variant="secondary" className="mt-1">
              {tPay(receipt.payment_mode)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{tCommon("reference")}</p>
            <p className="text-sm">{receipt.reference_no || tCommon("dash")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("receivedBy")}</p>
            <p className="text-sm">{receivedBy?.full_name ?? tCommon("dash")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("remainingBalance")}</p>
            <p className="text-sm">{formatPkr(sale.remaining_amount, locale)}</p>
          </div>
        </CardContent>
      </Card>

      <ReceiptPrintView
        receipt={{
          code: receipt.code,
          payment_date: receipt.payment_date,
          amount: Number(receipt.amount),
          amount_in_words: receipt.amount_in_words,
          payment_mode: receipt.payment_mode,
          reference_no: receipt.reference_no,
          notes: receipt.notes,
          customer,
          sale,
          receivedBy: receivedBy?.full_name ?? null,
          allocations,
        }}
      />
    </div>
  );
}
