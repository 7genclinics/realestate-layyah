"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { roundMoney } from "@/lib/installments";
import { canManageAccounts, canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";

type ActionResult = { error: string | null };

function revalidateCollections(saleId?: string | null, customerId?: string | null) {
  revalidatePath("/installments");
  revalidatePath("/receipts");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  if (saleId) {
    revalidatePath(`/bookings/${saleId}`);
  }
  if (customerId) {
    revalidatePath(`/customers/${customerId}`);
  }
}

/**
 * Waive an installment. The open balance (scheduled − received) is forgiven, so
 * we also reduce the parent sale's running receivable to keep balances honest.
 * Reversible via clearInstallmentOverride, which re-adds the forgiven amount.
 */
export async function waiveInstallment(input: {
  id: string;
  reason: string;
}): Promise<ActionResult> {
  const id = input.id?.trim();
  const reason = input.reason?.trim();

  if (!id) {
    return { error: "Missing installment reference." };
  }
  if (!reason) {
    return { error: "A reason is required to waive an installment." };
  }

  const { profile } = await requireProfile();
  if (!canManageAccounts(profile.role)) {
    return { error: "You do not have permission to waive installments." };
  }

  const supabase = await createClient();
  const { data: installment, error: loadError } = await supabase
    .from("installments")
    .select(
      "id, sale_id, period_label, scheduled_amount, received_amount, status_override, sales(customer_id, remaining_amount, status)",
    )
    .eq("id", id)
    .maybeSingle();

  if (loadError || !installment) {
    return { error: loadError?.message ?? "Installment not found." };
  }

  if (installment.status_override === "waived") {
    return { error: "This installment is already waived." };
  }

  const sale = Array.isArray(installment.sales)
    ? installment.sales[0]
    : installment.sales;

  const openAmount = roundMoney(
    Math.max(
      0,
      Number(installment.scheduled_amount) - Number(installment.received_amount),
    ),
  );

  const { error: updateError } = await supabase
    .from("installments")
    .update({ status_override: "waived", waived_reason: reason })
    .eq("id", id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Reduce the sale's receivable by the forgiven amount.
  if (sale && openAmount > 0) {
    const newRemaining = roundMoney(
      Math.max(0, Number(sale.remaining_amount) - openAmount),
    );
    await supabase
      .from("sales")
      .update({ remaining_amount: newRemaining, updated_at: new Date().toISOString() })
      .eq("id", installment.sale_id);
  }

  await logAudit({
    action: "waive",
    entityType: "installment",
    entityId: id,
    summary: `Waived installment ${installment.period_label} (PKR ${openAmount.toLocaleString()} forgiven)`,
    metadata: { reason, openAmount, saleId: installment.sale_id },
    actorId: profile.id,
  });

  revalidateCollections(installment.sale_id, sale?.customer_id);
  return { error: null };
}

/**
 * Move an installment's due date and flag it as rescheduled. Purely a schedule
 * change — no balance impact. The override only surfaces while unpaid.
 */
export async function rescheduleInstallment(input: {
  id: string;
  dueDate: string;
  note?: string;
}): Promise<ActionResult> {
  const id = input.id?.trim();
  const dueDate = input.dueDate?.trim();
  const note = input.note?.trim() || null;

  if (!id) {
    return { error: "Missing installment reference." };
  }
  if (!dueDate || Number.isNaN(new Date(`${dueDate}T00:00:00`).getTime())) {
    return { error: "Enter a valid new due date." };
  }

  const { profile } = await requireProfile();
  if (!canManageCrm(profile.role)) {
    return { error: "You do not have permission to reschedule installments." };
  }

  const supabase = await createClient();
  const { data: installment, error: loadError } = await supabase
    .from("installments")
    .select("id, sale_id, period_label, due_date, sales(customer_id)")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !installment) {
    return { error: loadError?.message ?? "Installment not found." };
  }

  const sale = Array.isArray(installment.sales)
    ? installment.sales[0]
    : installment.sales;

  const { error: updateError } = await supabase
    .from("installments")
    .update({
      due_date: dueDate,
      status_override: "rescheduled",
      reschedule_note: note,
    })
    .eq("id", id);

  if (updateError) {
    return { error: updateError.message };
  }

  await logAudit({
    action: "reschedule",
    entityType: "installment",
    entityId: id,
    summary: `Rescheduled installment ${installment.period_label} from ${installment.due_date} to ${dueDate}`,
    metadata: { from: installment.due_date, to: dueDate, note },
    actorId: profile.id,
  });

  revalidateCollections(installment.sale_id, sale?.customer_id);
  return { error: null };
}

/**
 * Clear a waive/reschedule override, restoring the installment to its derived
 * status. Re-adds a previously waived balance back onto the sale receivable.
 */
export async function clearInstallmentOverride(id: string): Promise<ActionResult> {
  if (!id) {
    return { error: "Missing installment reference." };
  }

  const { profile } = await requireProfile();
  if (!canManageAccounts(profile.role)) {
    return { error: "You do not have permission to change installment overrides." };
  }

  const supabase = await createClient();
  const { data: installment, error: loadError } = await supabase
    .from("installments")
    .select(
      "id, sale_id, period_label, scheduled_amount, received_amount, status_override, sales(customer_id, remaining_amount)",
    )
    .eq("id", id)
    .maybeSingle();

  if (loadError || !installment) {
    return { error: loadError?.message ?? "Installment not found." };
  }

  if (!installment.status_override) {
    return { error: "This installment has no override to clear." };
  }

  const sale = Array.isArray(installment.sales)
    ? installment.sales[0]
    : installment.sales;

  const wasWaived = installment.status_override === "waived";
  const openAmount = roundMoney(
    Math.max(
      0,
      Number(installment.scheduled_amount) - Number(installment.received_amount),
    ),
  );

  const { error: updateError } = await supabase
    .from("installments")
    .update({
      status_override: null,
      waived_reason: null,
      reschedule_note: null,
    })
    .eq("id", id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Restoring a waiver puts the forgiven balance back on the receivable.
  if (wasWaived && sale && openAmount > 0) {
    const newRemaining = roundMoney(Number(sale.remaining_amount) + openAmount);
    await supabase
      .from("sales")
      .update({ remaining_amount: newRemaining, updated_at: new Date().toISOString() })
      .eq("id", installment.sale_id);
  }

  await logAudit({
    action: "update",
    entityType: "installment",
    entityId: id,
    summary: `Cleared ${installment.status_override} override on installment ${installment.period_label}`,
    metadata: { restoredAmount: wasWaived ? openAmount : 0 },
    actorId: profile.id,
  });

  revalidateCollections(installment.sale_id, sale?.customer_id);
  return { error: null };
}
