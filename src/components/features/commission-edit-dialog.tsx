"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAgentCommission } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommissionEditDialogProps {
  id: string;
  commissionAmount: number;
  notes: string | null;
  status: string;
  dealLabel: string;
}

export function CommissionEditDialog({
  id,
  commissionAmount,
  notes,
  status,
  dealLabel,
}: CommissionEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(commissionAmount));
  const [remarks, setRemarks] = useState(notes ?? "");
  const [isPending, startTransition] = useTransition();

  const canEdit = status === "pending" || status === "approved";

  function close() {
    setOpen(false);
    setAmount(String(commissionAmount));
    setRemarks(notes ?? "");
  }

  function handleSave() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast.error("Enter a valid commission amount.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("commission_amount", String(parsed));
      formData.set("notes", remarks);

      const result = await updateAgentCommission(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        status === "approved"
          ? "Commission updated and sent back for approval."
          : "Commission updated.",
      );
      close();
      router.refresh();
    });
  }

  if (!canEdit) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon-xs"
        className="size-7 rounded-md border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
        title="Edit commission"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" />
        <span className="sr-only">Edit commission</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
          else setOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit commission</DialogTitle>
            <DialogDescription>
              Update the commission amount for <strong>{dealLabel}</strong>.
              {status === "approved" ? (
                <> Saving will reset this voucher to pending for re-approval.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`commission-amount-${id}`}>Commission amount (PKR)</Label>
              <Input
                id={`commission-amount-${id}`}
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`commission-notes-${id}`}>Notes &amp; deal remarks</Label>
              <Input
                id={`commission-notes-${id}`}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. 1.5% commission on Plot #45-B"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
