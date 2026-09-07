"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canApproveCommissions, canManageAgents } from "@/lib/permissions";
import { createClient } from "@/lib/server";

export async function createAgent(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageAgents(profile.role)) return;

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

  const { data } = await supabase
    .from("agents")
    .insert({
      name,
      phone,
      email: email || null,
      agency_name: agency_name || null,
      agent_type,
      commission_rate,
      status: "active",
    })
    .select("id")
    .single();

  await logAudit({
    action: "create",
    entityType: "agent",
    entityId: data?.id ?? null,
    summary: `Agent "${name}" registered`,
    actorId: profile.id,
  });

  revalidatePath("/agents");
}

export async function updateAgent(id: string, formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageAgents(profile.role)) return;

  const supabase = await createClient();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const agency_name = formData.get("agency_name") as string;
  const agent_type = (formData.get("agent_type") as string) || "local";
  const commission_rate = parseFloat(formData.get("commission_rate") as string || "0");
  const status = (formData.get("status") as string) || "active";

  if (!name || !phone) {
    return;
  }

  await supabase
    .from("agents")
    .update({
      name,
      phone,
      email: email || null,
      agency_name: agency_name || null,
      agent_type,
      commission_rate,
      status,
    })
    .eq("id", id);

  await logAudit({
    action: "update",
    entityType: "agent",
    entityId: id,
    summary: `Agent "${name}" updated`,
    actorId: profile.id,
  });

  revalidatePath("/agents");
  revalidatePath(`/agents/${id}`);
}

export async function recordAgentCommission(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageAgents(profile.role)) return;

  const supabase = await createClient();

  const agent_id = formData.get("agent_id") as string;
  const sale_id = formData.get("sale_id") as string;
  const commission_amount = parseFloat(formData.get("commission_amount") as string || "0");
  const notes = formData.get("notes") as string;

  if (!agent_id || !sale_id || !commission_amount) {
    return;
  }

  // New commissions start pending and must be approved before payout.
  await supabase
    .from("agent_commissions")
    .insert({
      agent_id,
      sale_id,
      commission_amount,
      notes: notes || null,
      status: "pending",
    });

  await logAudit({
    action: "create",
    entityType: "agent_commission",
    entityId: agent_id,
    summary: `Commission of ${commission_amount} recorded (pending approval)`,
    actorId: profile.id,
  });

  revalidatePath("/agents");
  revalidatePath(`/agents/${agent_id}`);
  revalidatePath("/approvals");
}

export async function updateAgentCommission(formData: FormData): Promise<{ error: string | null }> {
  const { profile } = await requireProfile();
  const t = await getTranslations("toasts");
  if (!canManageAgents(profile.role)) {
    return { error: t("noPermissionEditCommission") };
  }

  const supabase = await createClient();

  const id = formData.get("id") as string;
  const commission_amount = parseFloat(formData.get("commission_amount") as string || "0");
  const notes = (formData.get("notes") as string) || null;

  if (!id || !commission_amount || commission_amount <= 0) {
    return { error: t("couldNotSaveCommission") };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("agent_commissions")
    .select("status, agent_id, commission_amount")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: t("commissionNotFound") };
  }

  if (existing.status === "paid" || existing.status === "cancelled") {
    return { error: t("cannotEditCommission", { status: existing.status }) };
  }

  const updatePayload: {
    commission_amount: number;
    notes: string | null;
    status?: string;
    approved_by?: null;
    approved_at?: null;
  } = {
    commission_amount,
    notes,
  };

  if (existing.status === "approved") {
    updatePayload.status = "pending";
    updatePayload.approved_by = null;
    updatePayload.approved_at = null;
  }

  const { error } = await supabase
    .from("agent_commissions")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "update",
    entityType: "agent_commission",
    entityId: id,
    summary: `Commission updated from ${existing.commission_amount} to ${commission_amount}`,
    actorId: profile.id,
  });

  revalidatePath("/agents");
  revalidatePath(`/agents/${existing.agent_id}`);
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function approveCommission(id: string): Promise<{ error: string | null }> {
  const { profile } = await requireProfile();
  if (!canApproveCommissions(profile.role)) {
    return { error: "You do not have permission to approve commissions." };
  }

  const supabase = await createClient();
  const { data: commission, error } = await supabase
    .from("agent_commissions")
    .update({
      status: "approved",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("agent_id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "approve",
    entityType: "agent_commission",
    entityId: id,
    summary: "Agent commission approved",
    actorId: profile.id,
  });

  revalidatePath("/agents");
  if (commission?.agent_id) revalidatePath(`/agents/${commission.agent_id}`);
  revalidatePath("/approvals");
  return { error: null };
}

export async function rejectCommission(id: string): Promise<{ error: string | null }> {
  const { profile } = await requireProfile();
  if (!canApproveCommissions(profile.role)) {
    return { error: "You do not have permission to reject commissions." };
  }

  const supabase = await createClient();
  const { data: commission, error } = await supabase
    .from("agent_commissions")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "pending")
    .select("agent_id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "reject",
    entityType: "agent_commission",
    entityId: id,
    summary: "Agent commission rejected",
    actorId: profile.id,
  });

  revalidatePath("/agents");
  if (commission?.agent_id) revalidatePath(`/agents/${commission.agent_id}`);
  revalidatePath("/approvals");
  return { error: null };
}

export async function recordAgentPayout(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageAgents(profile.role)) return;

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

  // Only allow paying out approved (or already-paid top-up) commissions.
  if (commission_id) {
    const { data: commission } = await supabase
      .from("agent_commissions")
      .select("status")
      .eq("id", commission_id)
      .maybeSingle();
    if (commission && commission.status === "pending") {
      return;
    }
  }

  const { data: payout, error } = await supabase
    .from("agent_payouts")
    .insert({
      agent_id,
      commission_id,
      amount,
      cash_account_id,
      payment_mode: payment_mode as never,
      reference_no: reference_no || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) {
    return;
  }

  if (commission_id) {
    await supabase.from("agent_commissions").update({ status: "paid" }).eq("id", commission_id);
  }

  await supabase.from("cash_transactions").insert({
    cash_account_id,
    transaction_type: "expense",
    amount,
    payment_mode: payment_mode as never,
    reference_no: reference_no || null,
    description: `Agent commission payout`,
    entered_by: profile.id,
    status: "posted",
  });

  await logAudit({
    action: "payment",
    entityType: "agent_payout",
    entityId: payout?.id ?? null,
    summary: `Agent commission payout of ${amount}`,
    actorId: profile.id,
  });

  revalidatePath("/agents");
  revalidatePath(`/agents/${agent_id}`);
  revalidatePath("/cash-book");
  revalidatePath("/reports");
}

export async function deleteAgent(id: string): Promise<void | { error?: string | null }> {
  const { profile } = await requireProfile();
  if (!canManageAgents(profile.role)) {
    return { error: "You do not have permission to delete agents." };
  }
  const supabase = await createClient();
  await supabase.from("agents").delete().eq("id", id);
  revalidatePath("/agents");
  return { error: null };
}
