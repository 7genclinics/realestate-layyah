import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageAccounts, canManageParties } from "@/lib/permissions";
import { PartyForm } from "@/components/features/party-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewPartyPage() {
  const { profile } = await requireProfile();

  if (!canManageParties(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Add party</h1>
        <p className="text-sm text-muted-foreground">
          Only owners, managers, accounts and site managers can add parties.
        </p>
        <Button render={<Link href="/parties" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add party</h1>
        <p className="text-sm text-muted-foreground">
          One master record for a landlord, contractor or vendor. Work orders
          are added separately.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Party profile</CardTitle>
          <CardDescription>
            Bank details are visible only to accounts, managers and owners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartyForm canEditBank={canManageAccounts(profile.role)} />
        </CardContent>
      </Card>
    </div>
  );
}
