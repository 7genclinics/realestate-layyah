import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
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
import { DocumentPreviewDialog } from "@/components/features/document-preview-dialog";
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
  const locale = await getLocale();
  const t = await getTranslations("pages.documents");
  const tType = await getTranslations("labels.documentType");
  const tStatus = await getTranslations("labels.documentStatus");
  const tEntity = await getTranslations("labels.documentEntity");
  const tCommon = await getTranslations("common");

  let query = supabase
    .from("documents")
    .select(
      "id, code, title, document_type, status, document_date, entity_type, entity_id, version, is_confidential, mime_type",
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
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {canManageDocuments(profile.role) ? (
          <Button render={<Link href="/documents/new" />}>{t("upload")}</Button>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="h-8 max-w-sm rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">{t("allTypes")}</option>
          {Object.keys(DOCUMENT_TYPE_LABELS).map((value) => (
            <option key={value} value={value}>
              {tType(value)}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">{t("currentVersions")}</option>
          {Object.keys(DOCUMENT_STATUS_LABELS).map((value) => (
            <option key={value} value={value}>
              {tStatus(value)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          {tCommon("filter")}
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("id")}</TableHead>
              <TableHead>{tCommon("title")}</TableHead>
              <TableHead>{tCommon("type")}</TableHead>
              <TableHead>{t("linkedTo")}</TableHead>
              <TableHead>{tCommon("date")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="text-right">{t("action")}</TableHead>
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
                        {t("confidential")}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{tType(row.document_type)}</TableCell>
                  <TableCell>
                    <Link
                      href={entityRecordHref(row.entity_type, row.entity_id)}
                      className="underline-offset-4 hover:underline"
                    >
                      {tEntity(row.entity_type)}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(row.document_date, locale)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
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
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
