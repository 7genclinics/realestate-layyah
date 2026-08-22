"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Copies a sanitized plot summary to the clipboard (or opens the native share
 * sheet when available) so an agent can forward a listing on WhatsApp etc.
 */
export function AgentShareButton({ text }: { text: string }) {
  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Listing copied — paste it into WhatsApp or SMS.");
    } catch (err) {
      // User dismissed the share sheet, or clipboard was blocked.
      if ((err as Error)?.name === "AbortError") return;
      toast.error("Could not share this listing.");
    }
  }

  return (
    <Button size="sm" variant="outline" className="text-xs" onClick={handleShare}>
      <Share2 className="mr-1 size-3" /> Share
    </Button>
  );
}
