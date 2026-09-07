"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AgentShareButton({ text }: { text: string }) {
  const t = useTranslations("common");
  const tToasts = useTranslations("toasts");

  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(tToasts("listingCopied"));
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      toast.error(tToasts("couldNotShare"));
    }
  }

  return (
    <Button size="sm" variant="outline" className="text-xs" onClick={handleShare}>
      <Share2 className="mr-1 size-3" /> {t("share")}
    </Button>
  );
}
