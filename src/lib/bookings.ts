import { createClient } from "@/lib/server";
import { deriveInstallmentStatus } from "@/lib/permissions";

export async function getBookingsList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      customers (id, full_name, phone, cnic),
      properties (id, plot_no, property_type, area, area_unit, societies (id, name)),
      installments (id, due_date, scheduled_amount, received_amount, status_override)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookings list:", error);
    return [];
  }

  return (data || []).map((sale: any) => {
    const installments = sale.installments || [];
    const totalInst = installments.length;
    // Installment status is derived at read time — there is no stored column.
    const paidInst = installments.filter(
      (inst: any) =>
        deriveInstallmentStatus(
          inst.due_date,
          Number(inst.scheduled_amount),
          Number(inst.received_amount),
          { statusOverride: inst.status_override },
        ) === "paid",
    ).length;
    const totalReceived = installments.reduce(
      (sum: number, inst: { received_amount: number }) =>
        sum + Number(inst.received_amount || 0),
      0,
    );
    const totalAmount = Number(sale.sale_amount || 0);

    return {
      ...sale,
      total_amount: totalAmount,
      total_installments_count: totalInst,
      paid_installments_count: paidInst,
      total_received_amount: totalReceived,
      remaining_balance: totalAmount - totalReceived,
    };
  });
}
