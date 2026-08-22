import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { AllInOneReports } from "@/components/features/all-in-one-reports";
import { ReportsNav } from "@/components/features/reports-nav";

export default async function ReportsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const [
    { data: sales },
    { data: receipts },
    { data: transactions },
    { data: installments },
    { data: properties },
    { data: contracts },
    { data: landParcels },
    { data: devExpenses },
    { data: societies },
    { data: customers },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("*, customers(id, code, full_name, phone, stage), societies(id, name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("receipts")
      .select("*, customers(id, code, full_name), sales(plot_no, code, society_id)")
      .order("payment_date", { ascending: false }),
    supabase
      .from("cash_transactions")
      .select("*, cash_categories(name, group_name), societies(name)")
      .eq("status", "posted")
      .order("transaction_date", { ascending: false }),
    supabase
      .from("installments")
      .select("*, sales(id, code, plot_no, society_id, customer_id, customers(full_name, phone, code))")
      .order("due_date"),
    supabase
      .from("properties")
      .select("*, societies(id, name), society_blocks(name)")
      .order("plot_no"),
    supabase
      .from("contracts")
      .select("*, parties(id, name, code, phone), societies(id, name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("land_parcels")
      .select("*, parties(id, name, phone), societies(id, name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("development_expenses")
      .select("*, development_projects(id, name, category, societies(name))")
      .order("expense_date", { ascending: false }),
    supabase
      .from("societies")
      .select("id, name, code, location")
      .order("name"),
    supabase
      .from("customers")
      .select("id, code, full_name, phone, stage")
      .order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <ReportsNav />
      <AllInOneReports
        sales={sales ?? []}
        receipts={receipts ?? []}
        transactions={transactions ?? []}
        installments={installments ?? []}
        properties={properties ?? []}
        contracts={contracts ?? []}
        landParcels={landParcels ?? []}
        devExpenses={devExpenses ?? []}
        societies={societies ?? []}
        customers={customers ?? []}
      />
    </div>
  );
}
