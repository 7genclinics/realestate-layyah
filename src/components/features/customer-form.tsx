"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import {
  CUSTOMER_RELATION_LABELS,
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STAGE_LABELS,
  ID_TYPE_LABELS,
} from "@/lib/constants";
import {
  customerSchema,
  type CustomerFormValues,
} from "@/lib/validations/customer";
import {
  FormAttachments,
  uploadPendingAttachments,
  type PendingAttachment,
} from "@/components/features/form-attachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function CustomerForm({
  customerId,
  defaultValues,
}: {
  customerId?: string;
  defaultValues?: Partial<CustomerFormValues>;
} = {}) {
  const router = useRouter();
  const isEdit = Boolean(customerId);
  const t = useTranslations("customers");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tRelation = useTranslations("labels.customerRelation");
  const tIdType = useTranslations("labels.idType");
  const tSource = useTranslations("labels.customerSource");
  const tStage = useTranslations("labels.customerStage");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: "",
      relation: "s_o",
      guardian_name: "",
      caste: "",
      id_type: "cnic",
      id_number: "",
      phone: "",
      phone_secondary: "",
      address: "",
      source: "walk_in",
      stage: "lead",
      notes: "",
      ...defaultValues,
    },
  });

  async function onSubmit(values: CustomerFormValues) {
    const result = isEdit
      ? await updateCustomer(customerId!, values)
      : await createCustomer(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? tToasts("couldNotSaveCustomer"));
      return;
    }

    const entityLabel = isEdit ? tToasts("customerUpdated") : tToasts("customerCreated");

    if (attachments.length) {
      const upload = await uploadPendingAttachments(
        "customer",
        result.id,
        attachments,
      );
      if (upload.failed) {
        toast.warning(
          tToasts("attachmentsFailed", {
            entity: entityLabel,
            count: upload.failed,
            suffix: upload.firstError ? `: ${upload.firstError}` : ".",
          }),
        );
      } else {
        toast.success(
          tToasts("attachmentsOk", {
            entity: entityLabel,
            count: upload.uploaded,
          }),
        );
      }
    } else {
      toast.success(entityLabel);
    }

    router.push(`/customers/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="full_name">{t("fullName")}</Label>
          <Input id="full_name" {...register("full_name")} />
          {errors.full_name ? (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="relation">{t("relation")}</Label>
          <select id="relation" className={selectClassName} {...register("relation")}>
            {Object.keys(CUSTOMER_RELATION_LABELS).map((value) => (
              <option key={value} value={value}>
                {tRelation(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardian_name">{t("guardianName")}</Label>
          <Input id="guardian_name" {...register("guardian_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_type">{t("idType")}</Label>
          <select id="id_type" className={selectClassName} {...register("id_type")}>
            {Object.keys(ID_TYPE_LABELS).map((value) => (
              <option key={value} value={value}>
                {tIdType(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_number">{t("cnicPassport")}</Label>
          <Input id="id_number" {...register("id_number")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("primaryPhone")}</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone ? (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_secondary">{t("secondaryPhone")}</Label>
          <Input id="phone_secondary" {...register("phone_secondary")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">{t("source")}</Label>
          <select id="source" className={selectClassName} {...register("source")}>
            {Object.keys(CUSTOMER_SOURCE_LABELS).map((value) => (
              <option key={value} value={value}>
                {tSource(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">{t("stage")}</Label>
          <select id="stage" className={selectClassName} {...register("stage")}>
            {Object.keys(CUSTOMER_STAGE_LABELS).map((value) => (
              <option key={value} value={value}>
                {tStage(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="caste">{t("caste")}</Label>
          <Input id="caste" {...register("caste")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">{t("address")}</Label>
          <Textarea id="address" rows={2} {...register("address")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">{t("notes")}</Label>
          <Textarea id="notes" rows={3} {...register("notes")} />
        </div>
      </section>

      <FormAttachments
        value={attachments}
        onChange={setAttachments}
        defaultType="identity"
        disabled={isSubmitting}
        description={t("attachHint")}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tForms("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {isEdit ? tForms("updateCustomer") : tForms("saveCustomer")}
        </Button>
      </div>
    </form>
  );
}
