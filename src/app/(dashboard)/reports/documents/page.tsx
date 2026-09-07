import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { canManageDocuments } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  DOCUMENT_ENTITY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { DocumentPreviewDialog } from "@/components/features/document-preview-dialog";
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
  const locale = await getLocale();
  const t = await getTranslations("reports");
  const tType = await getTranslations("labels.documentType");
  const tStatus = await getTranslations("labels.documentStatus");
  const tEntity = await getTranslations("labels.documentEntity");
  const tCommon = await getTranslations("common");

  if (!canManageDocuments(profile.role) && profile.role !== "auditor") {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("docsTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("noPermission")}</p>
        <Button render={<Link href="/reports" />} variant="outline">
          {tCommon("back")}
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select(
      "id, code, title, document_type, status, entity_type, document_date, version, mime_type",
    )
    .order("document_date", { ascending: false });

  const rows = documents ?? [];
  const submitted = rows.filter((row) => row.status === "submitted").length;
  const approved = rows.filter((row) => row.status === "approved").length;
  const rejected = rows.filter((row) => row.status === "rejected").length;

  return (
    <div className="space-y-6">
      <ReportHeader
        title={t("docsApprovals")}
        description={t("docsApprovalsDesc")}
        filename="documents-report"
        headers={[tCommon("code"), tCommon("title"), tCommon("type"), t("linkedTo"), tCommon("date"), tCommon("status"), t("version")]}
        rows={rows.map((row) => [
          row.code,
          row.title,
          tType(row.document_type),
          tEntity(row.entity_type),
          row.document_date,
          row.status,
          row.version,
        ])}
      />
      <ReportTotals
        items={[
          { label: t("submitted"), value: String(submitted) },
          { label: tCommon("approved"), value: String(approved) },
          { label: tCommon("rejected"), value: String(rejected) },
          { label: t("totalFiles"), value: String(rows.length) },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("code")}</TableHead>
              <TableHead>{tCommon("title")}</TableHead>
              <TableHead>{tCommon("type")}</TableHead>
              <TableHead>{t("linkedTo")}</TableHead>
              <TableHead>{tCommon("date")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="text-right">{t("action")}</TableHead>
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
                  <TableCell>{tType(row.document_type)}</TableCell>
                  <TableCell>{tEntity(row.entity_type)}</TableCell>
                  <TableCell>{formatDate(row.document_date, locale)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === "rejected" ? "destructive" : "secondary"}
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
                  {t("noDocuments")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
