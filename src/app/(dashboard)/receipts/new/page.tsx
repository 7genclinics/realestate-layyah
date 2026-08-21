import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { ReceivePaymentForm } from "@/components/features/receive-payment-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ sale?: string; installment?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;

  if (!canManageCrm(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Receive payment</h1>
        <p className="text-sm text-muted-foreground">
          Only sales, accounts, managers and owners can post receipts.
        </p>
        <Button render={<Link href="/receipts" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: sales }, { data: installments }] = await Promise.all([
    supabase
      .from("sales")
      .select(
        "id, code, plot_no, remaining_amount, customer_id, customers(full_name, code)",
      )
      .neq("status", "cancelled")
      .gt("remaining_amount", 0)
      .order("created_at", { ascending: false }),
    supabase
      .from("installments")
      .select(
        "id, sale_id, installment_no, period_label, scheduled_amount, received_amount",
      )
      .order("installment_no"),
  ]);

  if (!sales?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Receive payment</h1>
        <p className="text-sm text-muted-foreground">
          No open sales with a remaining balance. Create a booking first.
        </p>
        <Button render={<Link href="/bookings/new" />}>New booking</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Receive payment</h1>
        <p className="text-sm text-muted-foreground">
          Posts a receipt, allocates to EMI and updates the customer balance.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
          <CardDescription>
            Amount is allocated to the selected installment or oldest open EMI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceivePaymentForm
            sales={sales}
            installments={installments ?? []}
            defaultSaleId={params.sale}
            defaultInstallmentId={params.installment}
          />
        </CardContent>
      </Card>
    </div>
  );
}
