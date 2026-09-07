"use client";

import { useState } from "react";
import { Eye, ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getDocumentSignedUrl } from "@/lib/actions/documents";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { DocumentType } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentPreviewDialogProps {
  id: string;
  title: string;
  code?: string;
  mimeType?: string | null;
  documentType?: DocumentType | string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "icon" | "icon-sm";
  className?: string;
}

export function DocumentPreviewDialog({
  id,
  title,
  code,
  mimeType,
  documentType,
  variant = "ghost",
  size = "sm",
  className,
}: DocumentPreviewDialogProps) {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const tToasts = useTranslations("toasts");
  const tType = useTranslations("labels.documentType");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (!url) {
      setLoading(true);
      const result = await getDocumentSignedUrl(id);
      setLoading(false);

      if (result.error || !result.url) {
        toast.error(result.error ?? tToasts("couldNotLoadDocPreview"));
        setOpen(false);
        return;
      }
      setUrl(result.url);
    }
  }

  const isImage = mimeType?.startsWith("image/") || (url && /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(url));
  const isPdf = mimeType === "application/pdf" || (url && /\.pdf($|\?)/i.test(url));
  const typeLabel =
    documentType && documentType in DOCUMENT_TYPE_LABELS
      ? tType(documentType as DocumentType)
      : documentType;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className ?? "h-7 px-2 text-xs font-medium"}
        onClick={() => void handleOpen()}
        disabled={loading}
        title={t("previewTitle")}
        aria-label={t("previewAria")}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
        <span className="ml-1">{tCommon("preview")}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col p-6 sm:max-w-4xl">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              {code ? (
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                  {code}
                </span>
              ) : null}
              {typeLabel ? (
                <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {typeLabel}
                </span>
              ) : null}
            </div>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("modalHint")}
            </DialogDescription>
          </DialogHeader>

          <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-auto rounded-lg bg-muted/20 p-2">
            {loading ? (
              <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">{t("loadingPreview")}</p>
              </div>
            ) : !url ? (
              <p className="text-sm text-destructive">{t("failedPreview")}</p>
            ) : isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={title}
                className="max-h-[65vh] w-auto max-w-full rounded-md object-contain shadow-sm"
              />
            ) : isPdf ? (
              <iframe
                src={url}
                className="h-[65vh] w-full rounded-md border bg-card"
                title={title}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
                <p>{t("unsupported")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  {t("openWindow")}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between border-t pt-3 sm:justify-between">
            {url ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {t("openTab")}
              </Button>
            ) : <div />}
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              {tCommon("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
