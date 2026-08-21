import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { LandPaymentForm } from "@/components/features/land-payment-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PayLandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();

  if (!canManageAccounts(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Pay land</h1>
        <p className="text-sm text-muted-foreground">
          Only accounts, managers and owners can post land payments.
        </p>
        <Button render={<Link href={`/land-bank/${id}`} />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: parcel }, { data: accounts }] = await Promise.all([
    supabase
      .from("land_parcels")
      .select("id, code, title, remaining_amount, status")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("cash_accounts")
      .select("id, code, name, account_type")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!parcel) {
    notFound();
  }

  if (
    parcel.status !== "approved" &&
    parcel.status !== "partially_paid" &&
    parcel.status !== "fully_paid"
  ) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Pay land</h1>
        <p className="text-sm text-muted-foreground">
          Approve this acquisition before posting payments.
        </p>
        <Button render={<Link href={`/land-bank/${id}`} />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  if (!accounts?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Pay land</h1>
        <p className="text-sm text-muted-foreground">
          Configure a cash or bank account first.
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          Cash book
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Pay {parcel.code}
        </h1>
        <p className="text-sm text-muted-foreground">
          Posts a land-purchase expense to the cash book and reduces the parcel
          balance.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{parcel.title}</CardTitle>
          <CardDescription>Amount cannot exceed the remaining payable.</CardDescription>
        </CardHeader>
        <CardContent>
          <LandPaymentForm
            landParcelId={parcel.id}
            remainingAmount={Number(parcel.remaining_amount)}
            accounts={accounts}
          />
        </CardContent>
      </Card>
    </div>
  );
}
