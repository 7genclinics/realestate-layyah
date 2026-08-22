"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ApprovalAction = (id: string) => Promise<{ error: string | null }>;

export function ApprovalButtons({
  id,
  approveAction,
  rejectAction,
  approveLabel = "Approve",
  rejectLabel = "Reject",
}: {
  id: string;
  approveAction: ApprovalAction;
  rejectAction?: ApprovalAction;
  approveLabel?: string;
  rejectLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: ApprovalAction, successMessage: string) {
    startTransition(async () => {
      const result = await action(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        size="sm"
        onClick={() => run(approveAction, "Approved")}
        disabled={isPending}
        className="h-8"
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        {approveLabel}
      </Button>
      {rejectAction ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(rejectAction, "Rejected")}
          disabled={isPending}
          className="h-8 text-destructive hover:bg-destructive/10"
        >
          <X className="size-3.5" />
          {rejectLabel}
        </Button>
      ) : null}
    </div>
  );
}
