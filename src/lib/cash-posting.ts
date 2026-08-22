import type { createClient } from "@/lib/server";
import type { PaymentMode } from "@/lib/database.types";
import { roundMoney } from "@/lib/installments";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Resolve a default account to post to when the caller did not pick one.
 * Prefers an active cash account, then any active account.
 */
export async function resolveDefaultCashAccount(
  supabase: ServerClient,
  preferredType: "cash" | "bank" = "cash",
): Promise<string | null> {
  const { data: preferred } = await supabase
    .from("cash_accounts")
    .select("id")
    .eq("is_active", true)
    .eq("account_type", preferredType)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (preferred?.id) {
    return preferred.id;
  }

  const { data: fallback } = await supabase
    .from("cash_accounts")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return fallback?.id ?? null;
}

/**
 * Post a customer receipt to the cash book as an income transaction.
 *
 * Idempotent: if a cash_transaction already references this receipt (e.g. a DB
 * trigger created it, or this ran before), it does nothing. This keeps exactly
 * one ledger row per receipt regardless of how many times it is called.
 *
 * Non-fatal by contract: returns { error } but callers treat receipt creation as
 * the source of truth and should not roll back a receipt if posting fails.
 */
export async function postReceiptToCashBook(
  supabase: ServerClient,
  args: {
    receiptId: string;
    cashAccountId: string;
    societyId?: string | null;
    amount: number;
    date: string;
    paymentMode: PaymentMode;
    referenceNo?: string | null;
    description: string;
    counterpartyName?: string | null;
    enteredBy?: string | null;
  },
): Promise<{ error: string | null; skipped: boolean }> {
  const { data: existing } = await supabase
    .from("cash_transactions")
    .select("id")
    .eq("receipt_id", args.receiptId)
    .maybeSingle();

  if (existing) {
    return { error: null, skipped: true };
  }

  const { error } = await supabase.from("cash_transactions").insert({
    transaction_type: "income",
    cash_account_id: args.cashAccountId,
    society_id: args.societyId ?? null,
    receipt_id: args.receiptId,
    amount: roundMoney(args.amount),
    transaction_date: args.date,
    payment_mode: args.paymentMode,
    description: args.description,
    reference_no: args.referenceNo ?? null,
    counterparty_name: args.counterpartyName ?? null,
    entered_by: args.enteredBy ?? null,
    status: "posted",
  });

  return { error: error?.message ?? null, skipped: false };
}

/**
 * Post a land-bank payment to the cash book as an expense transaction.
 *
 * Idempotent on land_payment_id, matching {@link postReceiptToCashBook}.
 */
export async function postLandPaymentToCashBook(
  supabase: ServerClient,
  args: {
    landPaymentId: string;
    landParcelId?: string | null;
    partyId?: string | null;
    cashAccountId: string;
    societyId?: string | null;
    amount: number;
    date: string;
    paymentMode: PaymentMode;
    referenceNo?: string | null;
    description: string;
    counterpartyName?: string | null;
    enteredBy?: string | null;
  },
): Promise<{ error: string | null; skipped: boolean }> {
  const { data: existing } = await supabase
    .from("cash_transactions")
    .select("id")
    .eq("land_payment_id", args.landPaymentId)
    .maybeSingle();

  if (existing) {
    return { error: null, skipped: true };
  }

  const { error } = await supabase.from("cash_transactions").insert({
    transaction_type: "expense",
    cash_account_id: args.cashAccountId,
    society_id: args.societyId ?? null,
    land_payment_id: args.landPaymentId,
    land_parcel_id: args.landParcelId ?? null,
    party_id: args.partyId ?? null,
    amount: roundMoney(args.amount),
    transaction_date: args.date,
    payment_mode: args.paymentMode,
    description: args.description,
    reference_no: args.referenceNo ?? null,
    counterparty_name: args.counterpartyName ?? null,
    entered_by: args.enteredBy ?? null,
    status: "posted",
  });

  return { error: error?.message ?? null, skipped: false };
}
