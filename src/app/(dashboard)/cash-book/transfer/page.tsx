import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { CashTransferForm } from "@/components/features/cash-transfer-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CashTransferPage() {
  const { profile } = await requireProfile();

  if (!canManageAccounts(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Transfer</h1>
        <p className="text-sm text-muted-foreground">
          Only accounts staff, managers and owners can post transfers.
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("cash_accounts")
    .select("id, code, name, account_type")
    .eq("is_active", true)
    .order("name");

  if (!accounts || accounts.length < 2) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Transfer</h1>
        <p className="text-sm text-muted-foreground">
          At least two active accounts are required for a transfer.
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cash / bank transfer
        </h1>
        <p className="text-sm text-muted-foreground">
          Moves funds between accounts without counting as income or expense.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transfer details</CardTitle>
          <CardDescription>
            Creates paired out/in vouchers linked together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashTransferForm accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
