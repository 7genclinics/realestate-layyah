import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageDocuments } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { entityRecordHref } from "@/lib/documents";
import {
  DOCUMENT_ENTITY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import type { DocumentStatus, DocumentType } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>;
}) {
  const { profile } = await requireProfile();
  const { type, status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("documents")
    .select(
      "id, code, title, document_type, status, document_date, entity_type, entity_id, version, is_confidential",
    )
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (type && type in DOCUMENT_TYPE_LABELS) {
    query = query.eq("document_type", type as DocumentType);
  }

  if (status && status in DOCUMENT_STATUS_LABELS) {
    query = query.eq("status", status as DocumentStatus);
  } else if (!status) {
    query = query.neq("status", "replaced");
  }

  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`title.ilike.%${term}%,code.ilike.%${term}%`);
  }

  const { data: documents, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Agreements, IDs, invoices and payment proofs linked to operational
            records.
          </p>
        </div>
        {canManageDocuments(profile.role) ? (
          <Button render={<Link href="/documents/new" />}>Upload document</Button>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title or ID"
          className="h-8 max-w-sm rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">All types</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Current versions</option>
          {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Linked to</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-destructive">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : documents?.length ? (
              documents.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/documents/${row.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {row.title}
                    {row.version > 1 ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        v{row.version}
                      </span>
                    ) : null}
                    {row.is_confidential ? (
                      <Badge variant="secondary" className="ml-2">
                        Confidential
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{DOCUMENT_TYPE_LABELS[row.document_type]}</TableCell>
                  <TableCell>
                    <Link
                      href={entityRecordHref(row.entity_type, row.entity_id)}
                      className="underline-offset-4 hover:underline"
                    >
                      {DOCUMENT_ENTITY_LABELS[row.entity_type]}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {DOCUMENT_STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No documents uploaded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
