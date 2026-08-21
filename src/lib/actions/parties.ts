"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { roundMoney } from "@/lib/installments";
import { canManageAccounts, canManageParties } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  contractSchema,
  partyPaymentSchema,
  partySchema,
} from "@/lib/validations/party";

function revalidateParty(id?: string) {
  revalidatePath("/parties");
  revalidatePath("/cash-book");
  revalidatePath("/dashboard");
  if (id) {
    revalidatePath(`/parties/${id}`);
  }
}

export async function createParty(input: unknown) {
  const parsed = partySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid party details" };
  }

  const { profile } = await requireProfile();

  if (!canManageParties(profile.role)) {
    return { error: "You do not have permission to add parties." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { data, error } = await supabase
    .from("parties")
    .insert({
      name: values.name.trim(),
      party_type: values.party_type,
      phone: values.phone.trim(),
      phone_secondary: values.phone_secondary ?? null,
      address: values.address ?? null,
      id_number: values.id_number ?? null,
      opening_balance: roundMoney(values.opening_balance ?? 0),
      status: values.status,
      notes: values.notes ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create party." };
  }

  const hasBank =
    values.bank_name ||
    values.account_title ||
    values.account_no ||
    values.iban;

  if (hasBank && canManageAccounts(profile.role)) {
    const { error: bankError } = await supabase.from("party_bank_details").insert({
      party_id: data.id,
      bank_name: values.bank_name ?? null,
      account_title: values.account_title ?? null,
      account_no: values.account_no ?? null,
      iban: values.iban ?? null,
    });

    if (bankError) {
      return { error: bankError.message };
    }
  }

  revalidateParty(data.id);
  return { error: null, id: data.id };
}

export async function createContract(input: unknown) {
  const parsed = contractSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid work order details",
    };
  }

  const { profile } = await requireProfile();

  if (!canManageParties(profile.role)) {
    return { error: "You do not have permission to create work orders." };
  }

  const supabase = await createClient();
  const values = parsed.data;
  const contractValue = roundMoney(values.contract_value);

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      party_id: values.party_id,
      society_id: values.society_id ?? null,
      contract_type: values.contract_type,
      title: values.title.trim(),
      start_date: values.start_date ?? null,
      end_date: values.end_date ?? null,
      unit: values.unit,
      rate: roundMoney(values.rate),
      quantity: values.quantity,
      contract_value: contractValue,
      paid_amount: 0,
      remaining_amount: contractValue,
      retention_amount: roundMoney(values.retention_amount ?? 0),
      status: "active",
      notes: values.notes ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create work order." };
  }

  revalidateParty(values.party_id);
  revalidatePath(`/parties/${values.party_id}/contracts/${data.id}`);
  return { error: null, id: data.id, partyId: values.party_id };
}

export async function createPartyPayment(input: unknown) {
  const parsed = partyPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid payment details",
    };
  }

  const { profile } = await requireProfile();

  if (!canManageAccounts(profile.role)) {
    return { error: "You do not have permission to post party payments." };
  }

  const supabase = await createClient();
  const values = parsed.data;
  const amount = roundMoney(values.amount);

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("id, party_id, remaining_amount, status")
    .eq("id", values.contract_id)
    .maybeSingle();

  if (contractError || !contract) {
    return { error: contractError?.message ?? "Work order not found." };
  }

  if (contract.status === "cancelled") {
    return { error: "Cancelled work orders cannot receive payments." };
  }

  if (amount > Number(contract.remaining_amount)) {
    return {
      error: `Amount exceeds remaining balance of PKR ${contract.remaining_amount}.`,
    };
  }

  const { data, error } = await supabase
    .from("contract_payments")
    .insert({
      contract_id: contract.id,
      party_id: contract.party_id,
      cash_account_id: values.cash_account_id,
      amount,
      payment_date: values.payment_date,
      payment_mode: values.payment_mode,
      reference_no: values.reference_no ?? null,
      notes: values.notes ?? null,
      entered_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not post payment." };
  }

  // Update contract paid and remaining balances
  const { data: currentContract } = await supabase
    .from("contracts")
    .select("paid_amount, remaining_amount, contract_value")
    .eq("id", contract.id)
    .single();

  const currentPaid = Number(currentContract?.paid_amount ?? 0);
  const newPaid = roundMoney(currentPaid + amount);
  const newRemaining = roundMoney(Math.max(0, Number(contract.remaining_amount) - amount));
  const newStatus = newRemaining <= 0 ? "completed" : "active";

  await supabase
    .from("contracts")
    .update({
      paid_amount: newPaid,
      remaining_amount: newRemaining,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contract.id);

  revalidateParty(contract.party_id);
  return { error: null, id: data.id, partyId: contract.party_id };
}

export async function deleteParty(id: string): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageParties(profile.role)) return;
  const supabase = await createClient();
  await supabase.from("parties").delete().eq("id", id);
  revalidateParty();
}
