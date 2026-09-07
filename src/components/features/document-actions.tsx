"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getDocumentSignedUrl,
  reviewDocument,
} from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";

export function DocumentActions({
  id,
  canReview,
  status,
}: {
  id: string;
  canReview: boolean;
  status: string;
}) {
  const router = useRouter();
  const t = useTranslations("common");
  const tToasts = useTranslations("toasts");
  const [busy, setBusy] = useState<"download" | "approved" | "rejected" | null>(
    null,
  );

  async function download() {
    setBusy("download");
    const result = await getDocumentSignedUrl(id);
    setBusy(null);

    if (result.error || !result.url) {
      toast.error(result.error ?? tToasts("couldNotOpenFile"));
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function review(nextStatus: "approved" | "rejected") {
    setBusy(nextStatus);
    const result = await reviewDocument(id, nextStatus);
    setBusy(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      nextStatus === "approved" ? tToasts("documentApproved") : tToasts("documentRejected"),
    );
    router.refresh();
  }

  const showReview = canReview && (status === "submitted" || status === "draft");

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => void download()} disabled={busy !== null}>
        {busy === "download" ? <Loader2 className="animate-spin" /> : null}
        {t("openDownload")}
      </Button>
    </div>
  );
}
