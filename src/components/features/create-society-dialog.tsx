"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSociety } from "@/lib/actions/societies";
import { SOCIETY_STATUS_LABELS } from "@/lib/constants";
import {
  societySchema,
  type SocietyFormValues,
} from "@/lib/validations/society";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateSocietyDialog() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SocietyFormValues>({
    resolver: zodResolver(societySchema),
    defaultValues: {
      name: "",
      location: "",
      status: "planning",
      notes: "",
    },
  });

  async function onSubmit(values: SocietyFormValues) {
    const result = await createSociety(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Society created");
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add society</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New society / project</DialogTitle>
          <DialogDescription>
            Master record for a housing society or development project.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">Society name</Label>
            <Input id="name" placeholder="Mohkam Housing Society" {...register("name")} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="City / area" {...register("location")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              {...register("status")}
            >
              {Object.entries(SOCIETY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
