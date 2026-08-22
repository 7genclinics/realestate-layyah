"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canApproveExpenses, canManageDevelopment } from "@/lib/permissions";
import { createClient } from "@/lib/server";

export async function createDevelopmentProject(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageDevelopment(profile.role)) return;

  const supabase = await createClient();

  const society_id = formData.get("society_id") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const budget = parseFloat(formData.get("budget") as string || "0");
  const description = formData.get("description") as string;

  if (!society_id || !name || !category) {
    return;
  }

  await supabase
    .from("development_projects")
    .insert({
      society_id,
      name,
      category,
      budget,
      description,
      status: "active",
    });

  await logAudit({
    action: "create",
    entityType: "development_project",
    summary: `Development project "${name}" created`,
    actorId: profile.id,
  });

  revalidatePath("/development");
}

export async function addDevelopmentExpense(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageDevelopment(profile.role)) return;

  const supabase = await createClient();

  const project_id = formData.get("project_id") as string;
  const party_id = (formData.get("party_id") as string) || null;
  const contract_id = (formData.get("contract_id") as string) || null;
  const amount = parseFloat(formData.get("amount") as string || "0");
  const expense_date = formData.get("expense_date") as string || new Date().toISOString().split("T")[0];
  const description = formData.get("description") as string;
  const cash_account_id = (formData.get("cash_account_id") as string) || null;

  if (!project_id || !amount || !description) {
    return;
  }

  // Paid immediately (a cash account was chosen) → approved & posted.
  // Otherwise it is a commitment that needs approval before payment.
  const status = cash_account_id ? "approved" : "pending";

  const { data: expense, error } = await supabase
    .from("development_expenses")
    .insert({
      project_id,
      party_id,
      contract_id,
      amount,
      expense_date,
      description,
      cash_account_id,
      status,
    })
    .select("id")
    .single();

  if (error) {
    return;
  }

  if (cash_account_id) {
    await supabase.from("cash_transactions").insert({
      cash_account_id,
      transaction_type: "expense",
      amount,
      transaction_date: expense_date,
      party_id,
      description: `Development Expense: ${description}`,
      entered_by: profile.id,
      status: "posted",
    });
  }

  await logAudit({
    action: "create",
    entityType: "development_expense",
    entityId: expense?.id ?? null,
    summary: `Development expense of ${amount} (${status})`,
    actorId: profile.id,
  });

  revalidatePath("/development");
  revalidatePath("/cash-book");
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
}

export async function approveExpense(id: string): Promise<{ error: string | null }> {
  const { profile } = await requireProfile();
  if (!canApproveExpenses(profile.role)) {
    return { error: "You do not have permission to approve expenses." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("development_expenses")
    .update({
      status: "approved",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "approve",
    entityType: "development_expense",
    entityId: id,
    summary: "Development expense approved",
    actorId: profile.id,
  });

  revalidatePath("/development");
  revalidatePath("/approvals");
  return { error: null };
}

export async function rejectExpense(id: string): Promise<{ error: string | null }> {
  const { profile } = await requireProfile();
  if (!canApproveExpenses(profile.role)) {
    return { error: "You do not have permission to reject expenses." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("development_expenses")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "reject",
    entityType: "development_expense",
    entityId: id,
    summary: "Development expense rejected",
    actorId: profile.id,
  });

  revalidatePath("/development");
  revalidatePath("/approvals");
  return { error: null };
}

export async function deleteDevelopmentProject(id: string): Promise<void | { error?: string | null }> {
  const { profile } = await requireProfile();
  if (!canManageDevelopment(profile.role)) {
    return { error: "You do not have permission to delete projects." };
  }
  const supabase = await createClient();
  await supabase.from("development_projects").delete().eq("id", id);
  revalidatePath("/development");
  return { error: null };
}

export async function deleteDevelopmentExpense(id: string): Promise<void | { error?: string | null }> {
  const { profile } = await requireProfile();
  if (!canManageDevelopment(profile.role)) {
    return { error: "You do not have permission to delete expenses." };
  }
  const supabase = await createClient();
  await supabase.from("development_expenses").delete().eq("id", id);
  revalidatePath("/development");
  return { error: null };
}
