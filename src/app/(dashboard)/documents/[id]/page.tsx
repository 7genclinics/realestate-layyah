import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canApproveDocuments, canManageDocuments } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { entityRecordHref } from "@/lib/documents";
import {
  DOCUMENT_ENTITY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { DocumentActions } from "@/components/features/document-actions";
import { DocumentPreview } from "@/components/features/document-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: document } = await supabase
    .from("documents")
    .select(
      "*, uploader:profiles!documents_uploaded_by_fkey(full_name), approver:profiles!documents_approved_by_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!document) {
    notFound();
  }

  const uploadedBy = Array.isArray(document.uploader)
    ? document.uploader[0]
    : document.uploader;
  const approver = Array.isArray(document.approver)
    ? document.approver[0]
    : document.approver;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{document.code}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{document.title}</h1>
          <p className="text-sm text-muted-foreground">
            {DOCUMENT_TYPE_LABELS[document.document_type]} · v{document.version}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DocumentActions
            id={document.id}
            canReview={canApproveDocuments(profile.role)}
            status={document.status}
          />
          {canManageDocuments(profile.role) && document.status !== "replaced" ? (
            <Button
              variant="outline"
              render={
                <Link href={`/documents/new?replaces=${document.id}`} />
              }
            >
              New version
            </Button>
          ) : null}
          <Button render={<Link href="/documents" />} variant="outline">
            Back
          </Button>
        </div>
      </div>

      <DocumentPreview
        id={document.id}
        mimeType={document.mime_type}
        fileName={document.file_name}
      />

      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>
            Linked to{" "}
            <Link
              href={entityRecordHref(document.entity_type, document.entity_id)}
              className="underline-offset-4 hover:underline"
            >
              {DOCUMENT_ENTITY_LABELS[document.entity_type]}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Status">
            <Badge
              variant={document.status === "rejected" ? "destructive" : "secondary"}
            >
              {DOCUMENT_STATUS_LABELS[document.status]}
            </Badge>
          </Detail>
          <Detail label="Document date">{formatDate(document.document_date)}</Detail>
          <Detail label="File">{document.file_name}</Detail>
          <Detail label="Size">
            {document.file_size
              ? `${Math.round(document.file_size / 1024)} KB`
              : "—"}
          </Detail>
          <Detail label="Uploaded by">{uploadedBy?.full_name ?? "—"}</Detail>
          <Detail label="Approved by">
            {approver?.full_name
              ? `${approver.full_name} · ${formatDateTime(document.approved_at)}`
              : "—"}
          </Detail>
          <Detail label="Confidential">
            {document.is_confidential ? "Yes" : "No"}
          </Detail>
          <Detail label="Description">{document.description || "—"}</Detail>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
