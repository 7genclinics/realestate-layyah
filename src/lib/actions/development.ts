"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";

export async function createDevelopmentProject(formData: FormData): Promise<void> {
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

  revalidatePath("/development");
}

export async function addDevelopmentExpense(formData: FormData): Promise<void> {
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

  const { error } = await supabase
    .from("development_expenses")
    .insert({
      project_id,
      party_id,
      contract_id,
      amount,
      expense_date,
      description,
      cash_account_id,
    });

  if (error) {
    return;
  }

  if (cash_account_id) {
    await supabase.from("cash_transactions").insert({
      cash_account_id,
      transaction_type: "expense",
      amount,
      transaction_date: expense_date,
      description: `Development Expense: ${description}`,
    });
  }

  revalidatePath("/development");
  revalidatePath("/cash-book");
  revalidatePath("/dashboard");
}

export async function deleteDevelopmentProject(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("development_projects").delete().eq("id", id);
  revalidatePath("/development");
}

export async function deleteDevelopmentExpense(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("development_expenses").delete().eq("id", id);
  revalidatePath("/development");
}
