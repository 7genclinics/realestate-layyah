import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageParties } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { ContractForm } from "@/components/features/contract-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();

  if (!canManageParties(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">New work order</h1>
        <p className="text-sm text-muted-foreground">
          Only owners, managers, accounts and site managers can create work
          orders.
        </p>
        <Button render={<Link href={`/parties/${id}`} />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: parties }, { data: societies }] = await Promise.all([
    supabase.from("parties").select("id, code, name").eq("status", "active").order("name"),
    supabase.from("societies").select("id, code, name").order("name"),
  ]);

  if (!parties?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">New work order</h1>
        <p className="text-sm text-muted-foreground">Add a party first.</p>
        <Button render={<Link href="/parties/new" />}>Add party</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New work order</h1>
        <p className="text-sm text-muted-foreground">
          Rate × quantity becomes the contract value. Remaining payable starts
          at that amount.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Work order details</CardTitle>
          <CardDescription>
            Payments later reduce the remaining balance and post to the cash
            book.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractForm
            parties={parties}
            societies={societies ?? []}
            defaultPartyId={id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
