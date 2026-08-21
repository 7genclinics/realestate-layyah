"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { roundMoney } from "@/lib/installments";
import { canManageAccounts } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  cashTransferSchema,
  cashVoucherSchema,
} from "@/lib/validations/cash-book";

function revalidateCashBook() {
  revalidatePath("/cash-book");
  revalidatePath("/dashboard");
}

export async function createCashVoucher(input: unknown) {
  const parsed = cashVoucherSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid voucher details",
    };
  }

  const { profile } = await requireProfile();

  if (!canManageAccounts(profile.role)) {
    return { error: "You do not have permission to post cash book entries." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { data, error } = await supabase
    .from("cash_transactions")
    .insert({
      transaction_type: values.transaction_type,
      category_id: values.category_id,
      cash_account_id: values.cash_account_id,
      society_id: values.society_id ?? null,
      amount: roundMoney(values.amount),
      transaction_date: values.transaction_date,
      payment_mode: values.payment_mode,
      description: values.description,
      reference_no: values.reference_no ?? null,
      counterparty_name: values.counterparty_name ?? null,
      notes: values.notes ?? null,
      entered_by: profile.id,
      status: "posted",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not post voucher." };
  }

  revalidateCashBook();
  return { error: null, id: data.id };
}

export async function createCashTransfer(input: unknown) {
  const parsed = cashTransferSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid transfer details",
    };
  }

  const { profile } = await requireProfile();

  if (!canManageAccounts(profile.role)) {
    return { error: "You do not have permission to post transfers." };
  }

  const supabase = await createClient();
  const values = parsed.data;
  const amount = roundMoney(values.amount);
  const transferGroupId = crypto.randomUUID();

  const rows = [
    {
      transaction_type: "transfer" as const,
      cash_account_id: values.from_account_id,
      amount,
      transaction_date: values.transaction_date,
      description: values.description,
      reference_no: values.reference_no ?? null,
      notes: values.notes ?? null,
      transfer_group_id: transferGroupId,
      transfer_side: "out" as const,
      entered_by: profile.id,
      status: "posted" as const,
    },
    {
      transaction_type: "transfer" as const,
      cash_account_id: values.to_account_id,
      amount,
      transaction_date: values.transaction_date,
      description: values.description,
      reference_no: values.reference_no ?? null,
      notes: values.notes ?? null,
      transfer_group_id: transferGroupId,
      transfer_side: "in" as const,
      entered_by: profile.id,
      status: "posted" as const,
    },
  ];

  const { data, error } = await supabase
    .from("cash_transactions")
    .insert(rows)
    .select("id")
    .limit(1)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not post transfer." };
  }

  revalidateCashBook();
  return { error: null, id: data.id };
}
