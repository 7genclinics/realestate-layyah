import { createClient } from "@/lib/server";

export async function getDevelopmentProjects({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("development_projects")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("development_projects")
    .select(`
      *,
      societies (id, name),
      development_expenses (id, amount)
    `)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("Error fetching development projects:", error);
    return { data: [], total: 0 };
  }

  const computed = (data || []).map((project: any) => {
    const totalSpent = (project.development_expenses || []).reduce(
      (sum: number, exp: { amount: number }) => sum + Number(exp.amount),
      0
    );
    return {
      ...project,
      total_spent: totalSpent,
      remaining_budget: Number(project.budget) - totalSpent,
    };
  });

  return { data: computed, total: count ?? 0 };
}

export async function getDevelopmentExpenses({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("development_expenses")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("development_expenses")
    .select(`
      *,
      development_projects (id, name, category, societies (name)),
      parties (id, name),
      contracts (id, title),
      cash_accounts (id, name)
    `)
    .order("expense_date", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("Error fetching development expenses:", error);
    return { data: [], total: 0 };
  }

  return { data: data || [], total: count ?? 0 };
}
