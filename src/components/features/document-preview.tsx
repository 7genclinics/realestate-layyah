"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getDocumentSignedUrl } from "@/lib/actions/documents";

export function DocumentPreview({
  id,
  mimeType,
  fileName,
}: {
  id: string;
  mimeType?: string | null;
  fileName?: string | null;
}) {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const tToasts = useTranslations("toasts");
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getDocumentSignedUrl(id);
      if (!cancelled) {
        if (result.error || !result.url) {
          toast.error(result.error ?? tToasts("couldNotLoadPreview"));
        } else {
          setUrl(result.url);
        }
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, tToasts]);

  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border bg-muted/30">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!url) return null;

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-xl border bg-muted/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName ?? t("previewAlt")}
          className="mx-auto max-h-[600px] w-full object-contain"
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-xl border">
        <iframe
          src={url}
          className="h-[700px] w-full"
          title={fileName ?? t("pdfTitle")}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      <span>{t("previewUnavailable")}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4"
      >
        {tCommon("openDownload")}
      </a>
    </div>
  );
}
