"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  addLeadNote,
  convertLeadToCustomer,
  updateLeadStatus,
} from "@/lib/actions/leads";
import { ACTIVITY_TYPE_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-9 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

export function LeadActionsPanel({
  leadId,
  currentStatus,
  converted,
}: {
  leadId: string;
  currentStatus: string;
  converted: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("leads");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("labels.leadStatus");
  const tActivity = useTranslations("labels.activityType");
  const [status, setStatus] = useState(currentStatus);
  const [activityType, setActivityType] = useState("note");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isConverting, startConvert] = useTransition();

  function saveStatus() {
    startTransition(async () => {
      const result = await updateLeadStatus({ lead_id: leadId, status });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tToasts("pipelineUpdated"));
      router.refresh();
    });
  }

  function logNote() {
    startTransition(async () => {
      const result = await addLeadNote({
        lead_id: leadId,
        activity_type: activityType,
        body: note,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tToasts("activityLogged"));
      setNote("");
      router.refresh();
    });
  }

  function convert() {
    startConvert(async () => {
      const result = await convertLeadToCustomer(leadId);
      if (result.error || !result.customerId) {
        toast.error(result.error ?? tToasts("couldNotConvertLead"));
        return;
      }
      toast.success(tToasts("leadConverted"));
      router.push(`/customers/${result.customerId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="status">{t("pipelineStage")}</Label>
        <div className="flex gap-2">
          <select
            id="status"
            className={selectClassName}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {Object.keys(LEAD_STATUS_LABELS).map((value) => (
              <option key={value} value={value}>
                {tStatus(value)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={saveStatus}
            disabled={isPending || status === currentStatus}
          >
            {tCommon("update")}
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="activity_type">{t("logActivity")}</Label>
        <select
          id="activity_type"
          className={selectClassName}
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
        >
          {Object.keys(ACTIVITY_TYPE_LABELS)
            .filter((value) => value !== "status_change")
            .map((value) => (
              <option key={value} value={value}>
                {tActivity(value)}
              </option>
            ))}
        </select>
        <Textarea
          rows={3}
          placeholder={t("notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          type="button"
          onClick={logNote}
          disabled={isPending || !note.trim()}
          className="w-full"
        >
          {isPending ? <Loader2 className="animate-spin size-4" /> : null}
          {t("logButton")}
        </Button>
      </div>

      {!converted ? (
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="default"
            onClick={convert}
            disabled={isConverting}
            className="w-full"
          >
            {isConverting ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {t("convert")}
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("convertHint")}
          </p>
        </div>
      ) : (
        <div className="border-t pt-4 text-xs text-muted-foreground">
          {t("alreadyConverted")}
        </div>
      )}
    </div>
  );
}
