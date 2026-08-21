import { createClient } from "@/lib/server";

export async function getBookingsList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      customers (id, name, contact, cnic),
      properties (id, plot_number, property_type, total_area, area_unit, societies (id, name)),
      installments (id, status, scheduled_amount, received_amount)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookings list:", error);
    return [];
  }

  return (data || []).map((sale: any) => {
    const totalInst = (sale.installments || []).length;
    const paidInst = (sale.installments || []).filter(
      (inst: { status: string }) => inst.status === "paid"
    ).length;
    const totalReceived = (sale.installments || []).reduce(
      (sum: number, inst: { received_amount: number }) =>
        sum + Number(inst.received_amount || 0),
      0
    );

    return {
      ...sale,
      total_installments_count: totalInst,
      paid_installments_count: paidInst,
      total_received_amount: totalReceived,
      remaining_balance: Number(sale.total_amount) - totalReceived,
    };
  });
}
