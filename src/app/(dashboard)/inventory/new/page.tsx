import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageInventory } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { PropertyForm } from "@/components/features/property-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewPropertyPage() {
  const { profile } = await requireProfile();

  if (!canManageInventory(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Add property</h1>
        <p className="text-sm text-muted-foreground">
          Only owners, managers and inventory managers can add units.
        </p>
        <Button render={<Link href="/inventory" />} variant="outline">
          Back to inventory
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: societies }, { data: blocks }] = await Promise.all([
    supabase.from("societies").select("id, code, name").order("name"),
    supabase.from("society_blocks").select("id, name, society_id").order("name"),
  ]);

  if (!societies?.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Add property</h1>
        <p className="text-sm text-muted-foreground">
          Create a society first, then add plots and shops to its inventory.
        </p>
        <Button render={<Link href="/societies" />}>Go to societies</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add property</h1>
        <p className="text-sm text-muted-foreground">
          New units start as Available. Status changes are recorded in history.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventory details</CardTitle>
          <CardDescription>
            Acquisition cost and minimum price are hidden from sales and agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyForm
            societies={societies}
            blocks={blocks ?? []}
            role={profile.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}
