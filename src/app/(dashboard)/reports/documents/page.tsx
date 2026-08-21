import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { canManageDocuments } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  DOCUMENT_ENTITY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { ReportHeader, ReportTotals } from "@/components/features/report-header";
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

export default async function DocumentsReportPage() {
  const { profile } = await requireProfile();

  if (!canManageDocuments(profile.role) && profile.role !== "auditor") {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Documents report</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view this report.
        </p>
        <Button render={<Link href="/reports" />} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select(
      "id, code, title, document_type, status, entity_type, document_date, version",
    )
    .order("document_date", { ascending: false });

  const rows = documents ?? [];
  const submitted = rows.filter((row) => row.status === "submitted").length;
  const approved = rows.filter((row) => row.status === "approved").length;
  const rejected = rows.filter((row) => row.status === "rejected").length;

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Documents & approvals"
        description="Uploaded evidence with approval status. Replaced versions remain in the export."
        filename="documents-report"
        headers={["ID", "Title", "Type", "Linked to", "Date", "Status", "Version"]}
        rows={rows.map((row) => [
          row.code,
          row.title,
          DOCUMENT_TYPE_LABELS[row.document_type],
          DOCUMENT_ENTITY_LABELS[row.entity_type],
          row.document_date,
          row.status,
          row.version,
        ])}
      />
      <ReportTotals
        items={[
          { label: "Submitted", value: String(submitted) },
          { label: "Approved", value: String(approved) },
          { label: "Rejected", value: String(rejected) },
          { label: "Total files", value: String(rows.length) },
        ]}
      />
      <div className="rounded-xl border bg-card">
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
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/documents/${row.id}`}
                      className="font-mono text-xs underline-offset-4 hover:underline"
                    >
                      {row.code}
                    </Link>
                  </TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{DOCUMENT_TYPE_LABELS[row.document_type]}</TableCell>
                  <TableCell>{DOCUMENT_ENTITY_LABELS[row.entity_type]}</TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === "rejected" ? "destructive" : "secondary"}
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
