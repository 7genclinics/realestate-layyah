import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageDocuments } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { DocumentUploadForm } from "@/components/features/document-upload-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{
    entity?: string;
    id?: string;
    replaces?: string;
  }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;

  if (!canManageDocuments(profile.role)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Upload document</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to upload documents.
        </p>
        <Button render={<Link href="/documents" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const [
    { data: customers },
    { data: properties },
    { data: parties },
    { data: receipts },
    { data: vouchers },
    { data: societies },
    { data: parcels },
    { data: exchanges },
    previousResult,
  ] = await Promise.all([
    supabase.from("customers").select("id, code, full_name").order("full_name"),
    supabase.from("properties").select("id, code, plot_no").order("plot_no"),
    supabase.from("parties").select("id, code, name").order("name"),
    supabase.from("receipts").select("id, code").order("created_at", { ascending: false }).limit(50),
    supabase
      .from("cash_transactions")
      .select("id, code")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("societies").select("id, code, name").order("name"),
    supabase.from("land_parcels").select("id, code, title").order("created_at", { ascending: false }).limit(50),
    supabase.from("land_exchanges").select("id, code, incoming_title").order("created_at", { ascending: false }).limit(50),
    params.replaces
      ? supabase
          .from("documents")
          .select("id, title, entity_type, entity_id")
          .eq("id", params.replaces)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const previous = previousResult.data;
  const entityOptions = {
    customer: (customers ?? []).map((row) => ({
      id: row.id,
      label: `${row.code} · ${row.full_name}`,
    })),
    property: (properties ?? []).map((row) => ({
      id: row.id,
      label: `${row.code} · Plot ${row.plot_no}`,
    })),
    party: (parties ?? []).map((row) => ({
      id: row.id,
      label: `${row.code} · ${row.name}`,
    })),
    receipt: (receipts ?? []).map((row) => ({
      id: row.id,
      label: row.code,
    })),
    cash_transaction: (vouchers ?? []).map((row) => ({
      id: row.id,
      label: row.code,
    })),
    society: (societies ?? []).map((row) => ({
      id: row.id,
      label: `${row.code} · ${row.name}`,
    })),
    land_parcel: (parcels ?? []).map((row) => ({
      id: row.id,
      label: `${row.code} · ${row.title}`,
    })),
    land_exchange: (exchanges ?? []).map((row) => ({
      id: row.id,
      label: `${row.code} · ${row.incoming_title}`,
    })),
    sale: [] as { id: string; label: string }[],
    contract: [] as { id: string; label: string }[],
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {previous ? "Upload new version" : "Upload document"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Files are stored privately. Uploading a new version keeps the old file
          and marks it as replaced.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Document details</CardTitle>
          <CardDescription>
            JPG, PNG or PDF up to 10 MB. Confidential files are hidden from
            sales and site staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadForm
            entityOptions={entityOptions}
            defaultEntityType={previous?.entity_type ?? params.entity}
            defaultEntityId={previous?.entity_id ?? params.id}
            replacesId={previous?.id}
            defaultTitle={previous?.title}
          />
        </CardContent>
      </Card>
    </div>
  );
}
