import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageInventory, canViewPropertyCosts } from "@/lib/permissions";
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

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
  const { id } = await params;

  if (!canManageInventory(profile.role)) {
    redirect(`/inventory/${id}`);
  }

  const supabase = await createClient();
  const [{ data: property }, { data: societies }, { data: blocks }] =
    await Promise.all([
      supabase.from("properties").select("*").eq("id", id).maybeSingle(),
      supabase.from("societies").select("id, code, name").order("name"),
      supabase.from("society_blocks").select("id, name, society_id").order("name"),
    ]);

  if (!property) {
    notFound();
  }

  const { data: costs } = canViewPropertyCosts(profile.role)
    ? await supabase
        .from("property_costs")
        .select("acquisition_cost, min_approved_price")
        .eq("property_id", id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit property</h1>
          <p className="text-sm text-muted-foreground">
            Update plot {property.plot_no}. Use the status control on the detail
            page to change availability.
          </p>
        </div>
        <Button render={<Link href={`/inventory/${id}`} />} variant="outline">
          Cancel
        </Button>
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
            societies={societies ?? []}
            blocks={blocks ?? []}
            role={profile.role}
            propertyId={property.id}
            defaultValues={{
              society_id: property.society_id,
              block_id: property.block_id ?? "",
              new_block_name: "",
              property_type: property.property_type,
              plot_no: property.plot_no,
              length_ft: property.length_ft ?? undefined,
              width_ft: property.width_ft ?? undefined,
              area: Number(property.area),
              area_unit: property.area_unit,
              facing: property.facing ?? "",
              street_width_ft: property.street_width_ft ?? undefined,
              attributes: (property.attributes ?? []).join(", "),
              ownership_source: property.ownership_source,
              asking_price: property.asking_price ?? undefined,
              monthly_rent: property.monthly_rent ?? undefined,
              security_deposit: property.security_deposit ?? undefined,
              acquisition_cost: costs?.acquisition_cost ?? undefined,
              min_approved_price: costs?.min_approved_price ?? undefined,
              agent_visible: Boolean(property.agent_visible),
              internal_notes: property.internal_notes ?? "",
              agent_notes: property.agent_notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
