import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { ReceiptPrintView } from "@/components/features/receipt-print-view";
import { PrintReceiptButton } from "@/components/features/print-receipt-button";
import { Button } from "@/components/ui/button";

export default async function ReceiptPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();

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
    <div className="space-y-4 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <Button render={<Link href={`/receipts/${id}`} />} variant="outline">
          Back
        </Button>
        <PrintReceiptButton />
      </div>

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
