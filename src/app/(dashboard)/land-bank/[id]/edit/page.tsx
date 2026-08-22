import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

export default async function EditLandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
  const { id } = await params;

  if (!canManageLandBank(profile.role)) {
    redirect(`/land-bank/${id}`);
  }

  const supabase = await createClient();
  const [{ data: parcel }, { data: societies }, { data: parties }] =
    await Promise.all([
      supabase.from("land_parcels").select("*").eq("id", id).maybeSingle(),
      supabase.from("societies").select("id, code, name").order("name"),
      supabase
        .from("parties")
        .select("id, code, name")
        .eq("status", "active")
        .order("name"),
    ]);

  if (!parcel) {
    notFound();
  }

  // Financials are locked once a parcel is acquired — edit only pre-approval.
  if (parcel.status !== "proposed" && parcel.status !== "under_negotiation") {
    redirect(`/land-bank/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit land record</h1>
          <p className="text-sm text-muted-foreground">
            Update {parcel.title}. Available while the acquisition is still
            proposed or under negotiation.
          </p>
        </div>
        <Button render={<Link href={`/land-bank/${id}`} />} variant="outline">
          Cancel
        </Button>
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
          <LandParcelForm
            societies={societies ?? []}
            parties={parties ?? []}
            parcelId={parcel.id}
            defaultValues={{
              society_id: parcel.society_id,
              party_id: parcel.party_id ?? "",
              acquisition_type: parcel.acquisition_type,
              title: parcel.title,
              location: parcel.location ?? "",
              description: parcel.description ?? "",
              khasra: parcel.khasra ?? "",
              khewat: parcel.khewat ?? "",
              khata: parcel.khata ?? "",
              mouza: parcel.mouza ?? "",
              area: Number(parcel.area),
              area_unit: parcel.area_unit,
              rate_per_unit: Number(parcel.rate_per_unit ?? 0),
              purchase_value: Number(parcel.purchase_value ?? 0),
              token_amount: Number(parcel.token_amount ?? 0),
              status: parcel.status,
              agreement_terms: parcel.agreement_terms ?? "",
              notes: parcel.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
