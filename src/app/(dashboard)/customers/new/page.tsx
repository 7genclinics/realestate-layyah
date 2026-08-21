import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageCrm } from "@/lib/permissions";
import { CustomerForm } from "@/components/features/customer-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewCustomerPage() {
  const { profile } = await requireProfile();

  if (!canManageCrm(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Add customer</h1>
        <p className="text-sm text-muted-foreground">
          Only owners, managers, sales and accounts can add customers.
        </p>
        <Button render={<Link href="/customers" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add customer</h1>
        <p className="text-sm text-muted-foreground">
          Identity and contact details used on receipts and agreements.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer profile</CardTitle>
          <CardDescription>
            Plot pricing is captured later on the booking screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}
