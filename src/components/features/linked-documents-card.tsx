"use client";

import Link from "next/link";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import type { DocumentStatus, DocumentType } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
import { DocumentPreviewDialog } from "@/components/features/document-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LinkedDocument = {
  id: string;
  code: string;
  title: string;
  document_type: DocumentType;
  status: DocumentStatus;
  document_date: string;
  version: number;
  mime_type?: string | null;
};

export function LinkedDocumentsCard({
  entityType,
  entityId,
  documents,
  canUpload,
}: {
  entityType: string;
  entityId: string;
  documents: LinkedDocument[];
  canUpload: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Agreements, IDs and payment proofs attached to this record.
          </CardDescription>
        </div>
        {canUpload ? (
          <Button
            size="sm"
            variant="outline"
            render={
              <Link
                href={`/documents/new?entity=${entityType}&id=${entityId}`}
              />
            }
          >
            Upload
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length ? (
              documents.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/documents/${row.id}`}
                      className="font-mono text-xs underline-offset-4 hover:underline"
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
                  </TableCell>
                  <TableCell>{DOCUMENT_TYPE_LABELS[row.document_type]}</TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {DOCUMENT_STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DocumentPreviewDialog
                      id={row.id}
                      title={row.title}
                      code={row.code}
                      mimeType={row.mime_type}
                      documentType={row.document_type}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-muted-foreground"
                >
                  No documents attached yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
