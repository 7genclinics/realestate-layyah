import { createClient } from "@/lib/server";

export async function getAgents({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("agents")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("agents")
    .select(`
      *,
      agent_commissions (id, commission_amount, status),
      agent_payouts (id, amount)
    `)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("Error fetching agents:", error);
    return { data: [], total: 0 };
  }

  const computed = (data || []).map((agent: any) => {
    const totalCommission = (agent.agent_commissions || []).reduce(
      (sum: number, comm: { commission_amount: number }) => sum + Number(comm.commission_amount),
      0
    );
    const totalPaid = (agent.agent_payouts || []).reduce(
      (sum: number, pay: { amount: number }) => sum + Number(pay.amount),
      0
    );
    return {
      ...agent,
      total_commission: totalCommission,
      total_paid: totalPaid,
      balance_payable: totalCommission - totalPaid,
    };
  });

  return { data: computed, total: count ?? 0 };
}

export async function getAgentById(id: string) {
  const supabase = await createClient();
  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !agent) return null;

  const { data: commissions } = await supabase
    .from("agent_commissions")
    .select("*, sales (*, properties (*), customers (*))")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  const { data: payouts } = await supabase
    .from("agent_payouts")
    .select("*, cash_accounts (name)")
    .eq("agent_id", id)
    .order("payout_date", { ascending: false });

  return {
    ...agent,
    commissions: commissions || [],
    payouts: payouts || [],
  };
}
