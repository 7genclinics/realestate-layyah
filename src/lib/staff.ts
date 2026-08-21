import { createClient } from "@/lib/server";

export async function getStaffMembers({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("staff_members")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("staff_members")
    .select(`
      *,
      salary_advances (id, amount, repaid_amount, status)
    `)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("Error fetching staff members:", error);
    return { data: [], total: 0 };
  }

  const computed = (data || []).map((staff: any) => {
    const activeAdvance = (staff.salary_advances || [])
      .filter((adv: { status: string }) => adv.status === "active")
      .reduce((sum: number, adv: { amount: number; repaid_amount: number }) =>
        sum + (Number(adv.amount) - Number(adv.repaid_amount || 0)), 0);
    return {
      ...staff,
      active_advance: activeAdvance,
    };
  });

  return { data: computed, total: count ?? 0 };
}

export async function getStaffById(id: string) {
  const supabase = await createClient();
  const { data: staff, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !staff) return null;

  const { data: payroll } = await supabase
    .from("payroll_records")
    .select("*, cash_accounts (name)")
    .eq("staff_id", id)
    .order("period_month", { ascending: false });

  const { data: advances } = await supabase
    .from("salary_advances")
    .select("*, cash_accounts (name)")
    .eq("staff_id", id)
    .order("issue_date", { ascending: false });

  return {
    ...staff,
    payroll: payroll || [],
    advances: advances || [],
  };
}
