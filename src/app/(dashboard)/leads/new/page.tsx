import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { canManageLeads } from "@/lib/permissions";
import { LeadForm } from "@/components/features/lead-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewLeadPage() {
  const { profile } = await requireProfile();

  if (!canManageLeads(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Add lead</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to add leads.
        </p>
        <Button render={<Link href="/leads" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: societies }, { data: agents }] = await Promise.all([
    supabase
      .from("societies")
      .select("id, name")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("agents")
      .select("id, name")
      .eq("status", "active")
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add lead</h1>
        <p className="text-sm text-muted-foreground">
          Capture a new enquiry and drop it into the sales pipeline.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
          <CardDescription>
            Only a name is required — fill in the rest as you learn more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm societies={societies ?? []} agents={agents ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
