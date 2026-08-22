import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  canApproveLand,
  canManageDocuments,
  canManageInventory,
  canManageLandBank,
} from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  AREA_UNIT_LABELS,
  LAND_EXCHANGE_STATUS_LABELS,
} from "@/lib/constants";
import { formatPkr } from "@/lib/format";
import { LandActionButton } from "@/components/features/land-action-button";
import { LinkedDocumentsCard } from "@/components/features/linked-documents-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LandExchangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("land_exchanges")
    .select("*, parties(id, name, code), societies(name, code)")
    .eq("id", id)
    .maybeSingle();

  if (!deal) {
    notFound();
  }

  const party = Array.isArray(deal.parties) ? deal.parties[0] : deal.parties;
  const society = Array.isArray(deal.societies) ? deal.societies[0] : deal.societies;

  const [{ data: outgoingProperty }, { data: outgoingLand }, { data: incomingLand }, { data: documents }] =
    await Promise.all([
      deal.outgoing_property_id
        ? supabase
            .from("properties")
            .select("id, code, plot_no, status")
            .eq("id", deal.outgoing_property_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      deal.outgoing_land_id
        ? supabase
            .from("land_parcels")
            .select("id, code, title, status")
            .eq("id", deal.outgoing_land_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      deal.incoming_land_id
        ? supabase
            .from("land_parcels")
            .select("id, code, title, remaining_amount, status")
            .eq("id", deal.incoming_land_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("documents")
        .select("id, code, title, document_type, status, document_date, version, mime_type")
        .eq("entity_type", "land_exchange")
        .eq("entity_id", id)
        .neq("status", "replaced")
        .order("document_date", { ascending: false }),
    ]);

  const canApprove =
    canApproveLand(profile.role) &&
    (deal.status === "draft" || deal.status === "pending_approval");
  const canComplete =
    canManageLandBank(profile.role) &&
    deal.status === "approved" &&
    (!deal.outgoing_property_id || canManageInventory(profile.role));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{deal.code}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {deal.incoming_title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {society?.name ?? "—"} · {party?.name ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {LAND_EXCHANGE_STATUS_LABELS[deal.status]}
          </Badge>
          {canApprove ? (
            <LandActionButton action="approve-exchange" id={deal.id} label="Approve" />
          ) : null}
          {canComplete ? (
            <LandActionButton
              action="complete-exchange"
              id={deal.id}
              label="Complete exchange"
            />
          ) : null}
          <Button render={<Link href="/land-bank" />} variant="outline">
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outgoing value</CardDescription>
            <CardTitle className="text-xl">{formatPkr(deal.outgoing_value)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Incoming value</CardDescription>
            <CardTitle className="text-xl">{formatPkr(deal.incoming_value)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {Number(deal.difference_amount) >= 0
                ? "Society pays"
                : "Society receives"}
            </CardDescription>
            <CardTitle className="text-xl">
              {formatPkr(Math.abs(Number(deal.difference_amount)))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal details</CardTitle>
          <CardDescription>
            Incoming {deal.incoming_area} {AREA_UNIT_LABELS[deal.incoming_area_unit]}
            {deal.incoming_khasra ? ` · khasra ${deal.incoming_khasra}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Outgoing property</p>
            <p className="mt-1">
              {outgoingProperty ? (
                <Link
                  href={`/inventory/${outgoingProperty.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {outgoingProperty.code} · {outgoingProperty.plot_no}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outgoing land</p>
            <p className="mt-1">
              {outgoingLand ? (
                <Link
                  href={`/land-bank/${outgoingLand.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {outgoingLand.code} · {outgoingLand.title}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Incoming land record</p>
            <p className="mt-1">
              {incomingLand ? (
                <Link
                  href={`/land-bank/${incomingLand.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {incomingLand.code} · remaining{" "}
                  {formatPkr(incomingLand.remaining_amount)}
                </Link>
              ) : (
                "Created on completion"
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Party</p>
            <p className="mt-1">
              {party ? (
                <Link
                  href={`/parties/${party.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {party.name}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          {deal.agreement_terms ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Agreement</p>
              <p className="mt-1 whitespace-pre-wrap">{deal.agreement_terms}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <LinkedDocumentsCard
        entityType="land_exchange"
        entityId={deal.id}
        documents={documents ?? []}
        canUpload={canManageDocuments(profile.role)}
      />
    </div>
  );
}
