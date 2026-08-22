"use client";

import { useState, useTransition } from "react";
import { Ban, CalendarClock, MoreHorizontal, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  clearInstallmentOverride,
  rescheduleInstallment,
  waiveInstallment,
} from "@/lib/actions/installments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InstallmentActionsProps {
  id: string;
  periodLabel: string;
  dueDate: string;
  openAmount: number;
  statusOverride: string | null;
  canWaive: boolean;
}

export function InstallmentActions({
  id,
  periodLabel,
  dueDate,
  openAmount,
  statusOverride,
  canWaive,
}: InstallmentActionsProps) {
  const [mode, setMode] = useState<"reschedule" | "waive" | null>(null);
  const [newDate, setNewDate] = useState(dueDate);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const isOpen = openAmount > 0;
  const hasOverride = Boolean(statusOverride);

  function close() {
    setMode(null);
    setNote("");
    setReason("");
    setNewDate(dueDate);
  }

  function handleReschedule() {
    startTransition(async () => {
      const result = await rescheduleInstallment({ id, dueDate: newDate, note });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Installment ${periodLabel} rescheduled.`);
        close();
      }
    });
  }

  function handleWaive() {
    if (!reason.trim()) {
      toast.error("A reason is required to waive an installment.");
      return;
    }
    startTransition(async () => {
      const result = await waiveInstallment({ id, reason });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Installment ${periodLabel} waived.`);
        close();
      }
    });
  }

  function handleClear() {
    if (!window.confirm("Clear this override and restore the installment?")) return;
    startTransition(async () => {
      const result = await clearInstallmentOverride(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Override cleared.");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              className="size-7 rounded-md border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              title="Manage installment"
            />
          }
        >
          <MoreHorizontal className="size-3.5" />
          <span className="sr-only">Manage installment</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            disabled={!isOpen}
            onClick={() => setMode("reschedule")}
          >
            <CalendarClock className="size-4" />
            Reschedule
          </DropdownMenuItem>
          {canWaive ? (
            <DropdownMenuItem
              disabled={!isOpen}
              onClick={() => setMode("waive")}
            >
              <Ban className="size-4" />
              Waive balance
            </DropdownMenuItem>
          ) : null}
          {hasOverride && canWaive ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClear}>
                <RotateCcw className="size-4" />
                Clear override
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reschedule dialog */}
      <Dialog
        open={mode === "reschedule"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule installment</DialogTitle>
            <DialogDescription>
              Move the due date for milestone <strong>{periodLabel}</strong>. The
              schedule change is logged; balances are unaffected.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="reschedule-date">New due date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="reschedule-note">Note (optional)</Label>
              <Textarea
                id="reschedule-note"
                rows={2}
                placeholder="e.g. Customer requested a 2-week extension"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={isPending}>
              {isPending ? "Saving…" : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waive dialog */}
      <Dialog
        open={mode === "waive"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waive installment balance</DialogTitle>
            <DialogDescription>
              Forgive the open balance on milestone <strong>{periodLabel}</strong>.
              This reduces the customer&apos;s receivable and cannot be undone
              without a manager restoring it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="waive-reason">Reason</Label>
            <Textarea
              id="waive-reason"
              rows={3}
              placeholder="Why is this balance being waived?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleWaive} disabled={isPending}>
              {isPending ? "Waiving…" : "Confirm waive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
