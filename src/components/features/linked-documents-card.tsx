"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getDocumentSignedUrl } from "@/lib/actions/documents";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import type { DocumentStatus, DocumentType } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
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

function PreviewButton({ id, mimeType }: { id: string; mimeType?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function openPreview() {
    if (previewUrl) {
      setPreviewUrl(null);
      return;
    }
    setLoading(true);
    const result = await getDocumentSignedUrl(id);
    setLoading(false);
    if (result.error || !result.url) {
      toast.error(result.error ?? "Could not load preview");
      return;
    }
    setPreviewUrl(result.url);
  }

  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => void openPreview()}
        disabled={loading}
        aria-label="Preview document"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
        <span className="ml-1">{previewUrl ? "Close" : "Preview"}</span>
      </Button>

      {previewUrl ? (
        <div className="col-span-full mt-2 overflow-hidden rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs text-muted-foreground">Preview</span>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="rounded p-1 hover:bg-muted"
              aria-label="Close preview"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Document preview"
              className="mx-auto max-h-[500px] w-full object-contain p-2"
            />
          ) : isPdf ? (
            <iframe
              src={previewUrl}
              className="h-[500px] w-full"
              title="PDF preview"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
              <p>Preview not available for this file type.</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Open / download
              </a>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

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
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length ? (
              documents.map((row) => (
                <>
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
                    <TableCell>
                      <PreviewButton id={row.id} mimeType={row.mime_type} />
                    </TableCell>
                  </TableRow>
                </>
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
