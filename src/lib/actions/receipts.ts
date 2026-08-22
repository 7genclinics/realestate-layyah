"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { amountToWords } from "@/lib/amount-to-words";
import { postReceiptToCashBook } from "@/lib/cash-posting";
import { roundMoney } from "@/lib/installments";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { receivePaymentSchema } from "@/lib/validations/receipt";

type InstallmentRow = {
  id: string;
  installment_no: number;
  scheduled_amount: number;
  received_amount: number;
};

function remainingOnInstallment(row: InstallmentRow) {
  return roundMoney(Number(row.scheduled_amount) - Number(row.received_amount));
}

export async function receivePayment(input: unknown) {
  const parsed = receivePaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid payment details",
    };
  }

  const { profile } = await requireProfile();

  if (!canManageCrm(profile.role)) {
    return { error: "You do not have permission to receive payments." };
  }

  const supabase = await createClient();
  const values = parsed.data;
  const amount = roundMoney(values.amount);

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select(
      "id, customer_id, society_id, plot_no, sale_amount, remaining_amount, status, customers(full_name)",
    )
    .eq("id", values.sale_id)
    .maybeSingle();

  if (saleError || !sale) {
    return { error: saleError?.message ?? "Sale not found." };
  }

  if (sale.status === "cancelled") {
    return { error: "Cancelled sales cannot receive payments." };
  }

  if (amount > Number(sale.remaining_amount)) {
    return {
      error: `Amount exceeds remaining balance of PKR ${sale.remaining_amount}.`,
    };
  }

  const { data: installments, error: installmentError } = await supabase
    .from("installments")
    .select("id, installment_no, scheduled_amount, received_amount")
    .eq("sale_id", sale.id)
    .order("installment_no");

  if (installmentError || !installments?.length) {
    return { error: installmentError?.message ?? "No installments found." };
  }

  let remainingPayment = amount;
  const allocations: { installment_id: string; allocated_amount: number }[] = [];

  const ordered = values.installment_id
    ? [
        ...installments.filter((row) => row.id === values.installment_id),
        ...installments.filter((row) => row.id !== values.installment_id),
      ]
    : installments;

  for (const installment of ordered) {
    const open = remainingOnInstallment(installment);
    if (open <= 0 || remainingPayment <= 0) {
      continue;
    }

    const allocated = roundMoney(Math.min(open, remainingPayment));
    allocations.push({
      installment_id: installment.id,
      allocated_amount: allocated,
    });
    remainingPayment = roundMoney(remainingPayment - allocated);
  }

  if (!allocations.length) {
    return { error: "All installments for this sale are already paid." };
  }

  if (remainingPayment > 0) {
    return { error: "Could not allocate the full payment amount." };
  }

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .insert({
      sale_id: sale.id,
      customer_id: sale.customer_id,
      cash_account_id: values.cash_account_id,
      payment_date: values.payment_date,
      amount,
      amount_in_words: amountToWords(amount),
      payment_mode: values.payment_mode,
      reference_no: values.reference_no ?? null,
      notes: values.notes ?? null,
      received_by: profile.id,
    })
    .select("id")
    .single();

  if (receiptError || !receipt) {
    return { error: receiptError?.message ?? "Could not create receipt." };
  }

  const { error: allocationError } = await supabase
    .from("receipt_allocations")
    .insert(
      allocations.map((row) => ({
        receipt_id: receipt.id,
        installment_id: row.installment_id,
        allocated_amount: row.allocated_amount,
      })),
    );

  if (allocationError) {
    return { error: allocationError.message };
  }

  for (const allocation of allocations) {
    const installment = installments.find(
      (row) => row.id === allocation.installment_id,
    );

    if (!installment) {
      continue;
    }

    const newReceived = roundMoney(
      Number(installment.received_amount) + allocation.allocated_amount,
    );

    const { error: updateError } = await supabase
      .from("installments")
      .update({
        received_amount: newReceived,
        received_date: values.payment_date,
      })
      .eq("id", allocation.installment_id);

    if (updateError) {
      return { error: updateError.message };
    }
  }

  // Update sale remaining balance and completion status
  const newSaleRemaining = roundMoney(Math.max(0, Number(sale.remaining_amount) - amount));
  const newSaleStatus = newSaleRemaining <= 0 ? "fully_paid" : sale.status;
  await supabase
    .from("sales")
    .update({
      remaining_amount: newSaleRemaining,
      status: newSaleStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sale.id);

  // Post the collection to the cash book (idempotent — a DB trigger or a retry
  // will not double-count). Non-fatal: the receipt is the source of truth.
  const saleCustomer = Array.isArray(sale.customers)
    ? sale.customers[0]
    : sale.customers;
  await postReceiptToCashBook(supabase, {
    receiptId: receipt.id,
    cashAccountId: values.cash_account_id,
    societyId: sale.society_id ?? null,
    amount,
    date: values.payment_date,
    paymentMode: values.payment_mode,
    referenceNo: values.reference_no ?? null,
    description: `Collection · Plot ${sale.plot_no ?? ""} · ${saleCustomer?.full_name ?? "Customer"}`.trim(),
    counterpartyName: saleCustomer?.full_name ?? null,
    enteredBy: profile.id,
  });

  revalidatePath("/receipts");
  revalidatePath(`/receipts/${receipt.id}`);
  revalidatePath("/installments");
  revalidatePath("/customers");
  revalidatePath(`/customers/${sale.customer_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/cash-book");

  return { error: null, id: receipt.id };
}
