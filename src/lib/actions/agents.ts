"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";

export async function createAgent(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const agency_name = formData.get("agency_name") as string;
  const agent_type = (formData.get("agent_type") as string) || "local";
  const commission_rate = parseFloat(formData.get("commission_rate") as string || "0");

  if (!name || !phone) {
    return;
  }

  await supabase
    .from("agents")
    .insert({
      name,
      phone,
      email: email || null,
      agency_name: agency_name || null,
      agent_type,
      commission_rate,
      status: "active",
    });

  revalidatePath("/agents");
}

export async function recordAgentCommission(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const agent_id = formData.get("agent_id") as string;
  const sale_id = formData.get("sale_id") as string;
  const commission_amount = parseFloat(formData.get("commission_amount") as string || "0");
  const notes = formData.get("notes") as string;

  if (!agent_id || !sale_id || !commission_amount) {
    return;
  }

  await supabase
    .from("agent_commissions")
    .insert({
      agent_id,
      sale_id,
      commission_amount,
      notes: notes || null,
      status: "approved",
    });

  revalidatePath("/agents");
  revalidatePath(`/agents/${agent_id}`);
}

export async function recordAgentPayout(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const agent_id = formData.get("agent_id") as string;
  const commission_id = (formData.get("commission_id") as string) || null;
  const amount = parseFloat(formData.get("amount") as string || "0");
  const cash_account_id = formData.get("cash_account_id") as string;
  const payment_mode = (formData.get("payment_mode") as string) || "cash";
  const reference_no = formData.get("reference_no") as string;
  const notes = formData.get("notes") as string;

  if (!agent_id || !amount || !cash_account_id) {
    return;
  }

  const { error } = await supabase
    .from("agent_payouts")
    .insert({
      agent_id,
      commission_id,
      amount,
      cash_account_id,
      payment_mode,
      reference_no: reference_no || null,
      notes: notes || null,
    });

  if (error) {
    return;
  }

  await supabase.from("cash_transactions").insert({
    cash_account_id,
    transaction_type: "expense",
    amount,
    description: `Agent Commission Settlement Payout`,
  });

  revalidatePath("/agents");
  revalidatePath(`/agents/${agent_id}`);
  revalidatePath("/cash-book");
}

export async function deleteAgent(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("agents").delete().eq("id", id);
  revalidatePath("/agents");
}
