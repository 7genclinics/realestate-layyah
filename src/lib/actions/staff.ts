"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageStaff } from "@/lib/permissions";
import { createClient } from "@/lib/server";

export async function createStaffMember(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageStaff(profile.role)) return;

  const supabase = await createClient();

  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const cnic = formData.get("cnic") as string;
  const designation = formData.get("designation") as string;
  const department = (formData.get("department") as string) || "operations";
  const basic_salary = parseFloat(formData.get("basic_salary") as string || "0");

  if (!full_name || !phone || !designation) {
    return;
  }

  const { data } = await supabase
    .from("staff_members")
    .insert({
      full_name,
      phone,
      cnic: cnic || null,
      designation,
      department,
      basic_salary,
      status: "active",
    })
    .select("id")
    .single();

  await logAudit({
    action: "create",
    entityType: "staff_member",
    entityId: data?.id ?? null,
    summary: `Staff member "${full_name}" added`,
    actorId: profile.id,
  });

  revalidatePath("/staff");
}

export async function updateStaffMember(id: string, formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageStaff(profile.role)) return;

  const supabase = await createClient();

  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const cnic = formData.get("cnic") as string;
  const designation = formData.get("designation") as string;
  const department = (formData.get("department") as string) || "operations";
  const basic_salary = parseFloat(formData.get("basic_salary") as string || "0");
  const status = (formData.get("status") as string) || "active";

  if (!full_name || !phone || !designation) {
    return;
  }

  await supabase
    .from("staff_members")
    .update({
      full_name,
      phone,
      cnic: cnic || null,
      designation,
      department,
      basic_salary,
      status,
    })
    .eq("id", id);

  await logAudit({
    action: "update",
    entityType: "staff_member",
    entityId: id,
    summary: `Staff member "${full_name}" updated`,
    actorId: profile.id,
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${id}`);
}

export async function recordSalaryAdvance(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageStaff(profile.role)) return;

  const supabase = await createClient();

  const staff_id = formData.get("staff_id") as string;
  const amount = parseFloat(formData.get("amount") as string || "0");
  const cash_account_id = formData.get("cash_account_id") as string;
  const notes = formData.get("notes") as string;

  if (!staff_id || !amount || !cash_account_id) {
    return;
  }

  const { error } = await supabase
    .from("salary_advances")
    .insert({
      staff_id,
      amount,
      cash_account_id,
      notes: notes || null,
      status: "active",
    });

  if (error) {
    return;
  }

  await supabase.from("cash_transactions").insert({
    cash_account_id,
    transaction_type: "expense",
    amount,
    description: `Staff Salary Advance Payment`,
    entered_by: profile.id,
    status: "posted",
  });

  await logAudit({
    action: "payment",
    entityType: "salary_advance",
    entityId: staff_id,
    summary: `Salary advance of ${amount} paid`,
    actorId: profile.id,
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${staff_id}`);
  revalidatePath("/cash-book");
}

export async function processPayrollRecord(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageStaff(profile.role)) return;

  const supabase = await createClient();

  const staff_id = formData.get("staff_id") as string;
  const period_month = formData.get("period_month") as string;
  const basic_salary = parseFloat(formData.get("basic_salary") as string || "0");
  const bonus = parseFloat(formData.get("bonus") as string || "0");
  const advance_deduction = parseFloat(formData.get("advance_deduction") as string || "0");
  const other_deduction = parseFloat(formData.get("other_deduction") as string || "0");
  const cash_account_id = formData.get("cash_account_id") as string;

  if (!staff_id || !period_month || !basic_salary) {
    return;
  }

  const net_salary = basic_salary + bonus - advance_deduction - other_deduction;

  const { error } = await supabase
    .from("payroll_records")
    .insert({
      staff_id,
      period_month,
      basic_salary,
      bonus,
      advance_deduction,
      other_deduction,
      net_salary,
      payment_status: "paid",
      cash_account_id: cash_account_id || null,
      paid_at: new Date().toISOString(),
    });

  if (error) {
    return;
  }

  if (advance_deduction > 0) {
    await supabase
      .from("salary_advances")
      .update({ status: "recovered" })
      .eq("staff_id", staff_id)
      .eq("status", "active");
  }

  if (cash_account_id && net_salary > 0) {
    await supabase.from("cash_transactions").insert({
      cash_account_id,
      transaction_type: "expense",
      amount: net_salary,
      description: `Staff Monthly Salary Disbursement (${period_month})`,
      entered_by: profile.id,
      status: "posted",
    });
  }

  await logAudit({
    action: "payment",
    entityType: "payroll_record",
    entityId: staff_id,
    summary: `Payroll of ${net_salary} paid for ${period_month}`,
    actorId: profile.id,
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${staff_id}`);
  revalidatePath("/cash-book");
  revalidatePath("/reports");
}

export async function deleteStaffMember(id: string): Promise<void | { error?: string | null }> {
  const { profile } = await requireProfile();
  if (!canManageStaff(profile.role)) {
    return { error: "You do not have permission to delete staff." };
  }
  const supabase = await createClient();
  await supabase.from("staff_members").delete().eq("id", id);
  revalidatePath("/staff");
  return { error: null };
}
