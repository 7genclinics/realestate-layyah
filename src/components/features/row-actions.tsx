"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RowActionsProps {
  editHref?: string;
  viewHref?: string;
  deleteAction?: (id: string) => Promise<void | { error?: string | null }>;
  id: string;
  confirmMessage?: string;
}

export function RowActions({
  editHref,
  viewHref,
  deleteAction,
  id,
  confirmMessage,
}: RowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("common");

  function handleDelete() {
    if (
      !window.confirm(
        confirmMessage ?? t("confirmDelete"),
      )
    )
      return;
    if (!deleteAction) return;
    startTransition(async () => {
      const result = await deleteAction(id);
      if (result && typeof result === "object" && result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("recordDeleted"));
      }
    });
  }

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      {viewHref && (
        <Button
          variant="outline"
          size="icon-xs"
          className="size-7 rounded-md border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
          title={t("viewDetails")}
          render={<Link href={viewHref} />}
        >
          <Eye className="size-3.5" />
          <span className="sr-only">{t("view")}</span>
        </Button>
      )}
      {editHref && (
        <Button
          variant="outline"
          size="icon-xs"
          className="size-7 rounded-md border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
          title={t("editRecord")}
          render={<Link href={editHref} />}
        >
          <Pencil className="size-3.5" />
          <span className="sr-only">{t("edit")}</span>
        </Button>
      )}
      {deleteAction && (
        <Button
          variant="outline"
          size="icon-xs"
          onClick={handleDelete}
          disabled={isPending}
          className="size-7 rounded-md border-border/70 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
          title={t("deleteRecord")}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">{isPending ? t("deleting") : t("delete")}</span>
        </Button>
      )}
    </div>
  );
}

