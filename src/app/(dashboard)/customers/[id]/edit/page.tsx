import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { CustomerForm } from "@/components/features/customer-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
  const { id } = await params;

  if (!canManageCrm(profile.role)) {
    redirect(`/customers/${id}`);
  }

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select(
      "id, full_name, relation, guardian_name, caste, id_type, id_number, phone, phone_secondary, address, source, stage, notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit customer</h1>
          <p className="text-sm text-muted-foreground">
            Update identity and contact details for {customer.full_name}.
          </p>
        </div>
        <Button render={<Link href={`/customers/${id}`} />} variant="outline">
          Cancel
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer profile</CardTitle>
          <CardDescription>
            Changes here update the master record used on receipts and agreements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm
            customerId={customer.id}
            defaultValues={{
              full_name: customer.full_name,
              relation: customer.relation,
              guardian_name: customer.guardian_name ?? "",
              caste: customer.caste ?? "",
              id_type: customer.id_type,
              id_number: customer.id_number ?? "",
              phone: customer.phone,
              phone_secondary: customer.phone_secondary ?? "",
              address: customer.address ?? "",
              source: customer.source,
              stage: customer.stage,
              notes: customer.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
