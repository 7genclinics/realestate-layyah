import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageLandBank } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { LandExchangeForm } from "@/components/features/land-exchange-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewLandExchangePage() {
  const { profile } = await requireProfile();

  if (!canManageLandBank(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">New exchange</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to record land exchanges.
        </p>
        <Button render={<Link href="/land-bank" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: societies }, { data: parties }, { data: properties }, { data: parcels }] =
    await Promise.all([
      supabase.from("societies").select("id, code, name").order("name"),
      supabase
        .from("parties")
        .select("id, code, name")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("properties")
        .select("id, code, plot_no")
        .is("deleted_at", null)
        .neq("status", "transferred")
        .order("plot_no"),
      supabase
        .from("land_parcels")
        .select("id, code, title")
        .neq("status", "transferred")
        .order("created_at", { ascending: false }),
    ]);

  if (!societies?.length || !parties?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">New exchange</h1>
        <p className="text-sm text-muted-foreground">
          Create a society and a party (the other landowner) first.
        </p>
        <Button render={<Link href="/parties/new" />}>Add party</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Land exchange</h1>
        <p className="text-sm text-muted-foreground">
          Link the land or plot given by the society with the land received.
          Approval is required before inventory status changes.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Exchange deal</CardTitle>
          <CardDescription>
            Difference = incoming value − outgoing value. A positive difference
            is payable by the society after completion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LandExchangeForm
            societies={societies}
            parties={parties}
            properties={properties ?? []}
            parcels={parcels ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
