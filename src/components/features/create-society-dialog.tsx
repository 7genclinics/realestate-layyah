"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("societies");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("labels.societyStatus");
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

    toast.success(tToasts("societyCreated"));
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{tForms("addSociety")}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newTitle")}</DialogTitle>
          <DialogDescription>
            {t("newHint")}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" placeholder={t("namePlaceholder")} {...register("name")} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">{t("location")}</Label>
            <Input id="location" placeholder={t("locationPlaceholder")} {...register("location")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">{tCommon("status")}</Label>
            <select
              id="status"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              {...register("status")}
            >
              {Object.keys(SOCIETY_STATUS_LABELS).map((value) => (
                <option key={value} value={value}>
                  {tStatus(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{tCommon("notes")}</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {tForms("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {tForms("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
