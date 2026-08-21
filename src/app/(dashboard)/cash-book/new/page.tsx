import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { CashVoucherForm } from "@/components/features/cash-voucher-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewCashVoucherPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const defaultType = params.type === "income" ? "income" : "expense";

  if (!canManageAccounts(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">New voucher</h1>
        <p className="text-sm text-muted-foreground">
          Only accounts staff, managers and owners can post cash book entries.
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: accounts }, { data: categories }, { data: societies }] =
    await Promise.all([
      supabase
        .from("cash_accounts")
        .select("id, code, name, account_type")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("cash_categories")
        .select("id, name, group_name, category_type")
        .eq("is_active", true)
        .order("category_type")
        .order("group_name")
        .order("name"),
      supabase.from("societies").select("id, code, name").order("name"),
    ]);

  if (!accounts?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">New voucher</h1>
        <p className="text-sm text-muted-foreground">
          Configure at least one cash or bank account first.
        </p>
        <Button render={<Link href="/cash-book" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {defaultType === "income" ? "New income" : "New expense"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Posts a voucher to the daily cash book and updates account balances.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Voucher details</CardTitle>
          <CardDescription>
            Customer receipts from the Receive Payment screen are posted
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashVoucherForm
            accounts={accounts}
            categories={categories ?? []}
            societies={societies ?? []}
            defaultType={defaultType}
          />
        </CardContent>
      </Card>
    </div>
  );
}
