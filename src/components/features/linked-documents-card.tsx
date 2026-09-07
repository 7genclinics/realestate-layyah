"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const tType = useTranslations("labels.documentType");
  const tStatus = useTranslations("labels.documentStatus");
  const tForms = useTranslations("forms");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("cardHint")}
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
            {tForms("upload")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("code")}</TableHead>
              <TableHead>{tCommon("title")}</TableHead>
              <TableHead>{tCommon("type")}</TableHead>
              <TableHead>{tCommon("date")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
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
                  <TableCell>{tType(row.document_type)}</TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tStatus(row.status)}
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
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
