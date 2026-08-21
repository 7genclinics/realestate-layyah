import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageLandBank } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { LandParcelForm } from "@/components/features/land-parcel-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewLandPage() {
  const { profile } = await requireProfile();

  if (!canManageLandBank(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Add land</h1>
        <p className="text-sm text-muted-foreground">
          Only owners, managers, inventory managers and site managers can add
          land records.
        </p>
        <Button render={<Link href="/land-bank" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: societies }, { data: parties }] = await Promise.all([
    supabase.from("societies").select("id, code, name").order("name"),
    supabase
      .from("parties")
      .select("id, code, name")
      .eq("status", "active")
      .order("name"),
  ]);

  if (!societies?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Add land</h1>
        <p className="text-sm text-muted-foreground">
          Create a society first, then record land against it.
        </p>
        <Button render={<Link href="/societies" />}>Go to societies</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add land</h1>
        <p className="text-sm text-muted-foreground">
          Record a purchase, society-owned parcel or land received in exchange.
          Payments stay draft until the acquisition is approved.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Land details</CardTitle>
          <CardDescription>
            Optional khasra / khewat / khata / mouza fields stay on the record
            for registry work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LandParcelForm societies={societies} parties={parties ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
