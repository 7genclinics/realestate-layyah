"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
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
      toast.success("Pipeline stage updated");
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
      toast.success("Activity logged");
      setNote("");
      router.refresh();
    });
  }

  function convert() {
    startConvert(async () => {
      const result = await convertLeadToCustomer(leadId);
      if (result.error || !result.customerId) {
        toast.error(result.error ?? "Could not convert lead");
        return;
      }
      toast.success("Lead converted to customer");
      router.push(`/customers/${result.customerId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="status">Pipeline stage</Label>
        <div className="flex gap-2">
          <select
            id="status"
            className={selectClassName}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={saveStatus}
            disabled={isPending || status === currentStatus}
          >
            Update
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="activity_type">Log an activity</Label>
        <select
          id="activity_type"
          className={selectClassName}
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
        >
          {Object.entries(ACTIVITY_TYPE_LABELS)
            .filter(([value]) => value !== "status_change")
            .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>
        <Textarea
          rows={3}
          placeholder="What happened? (call summary, visit notes…)"
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
          Log activity
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
            Convert to customer
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Creates a customer record and marks this lead as won.
          </p>
        </div>
      ) : (
        <div className="border-t pt-4 text-xs text-muted-foreground">
          This lead has already been converted to a customer.
        </div>
      )}
    </div>
  );
}
