"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { uploadDocument } from "@/lib/actions/documents";
import {
  DOCUMENT_ENTITY_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

type EntityOption = { id: string; label: string };

export function DocumentUploadForm({
  entityOptions,
  defaultEntityType,
  defaultEntityId,
  replacesId,
  defaultTitle,
}: {
  entityOptions: Record<string, EntityOption[]>;
  defaultEntityType?: string;
  defaultEntityId?: string;
  replacesId?: string;
  defaultTitle?: string;
}) {
  const router = useRouter();
  const t = useTranslations("documents");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tType = useTranslations("labels.documentType");
  const tEntity = useTranslations("labels.documentEntity");
  const [entityType, setEntityType] = useState(
    defaultEntityType ?? "customer",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const records = entityOptions[entityType] ?? [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await uploadDocument(formData);
    setIsSubmitting(false);

    if (result.error || !result.id) {
      toast.error(result.error ?? tToasts("couldNotUploadDocument"));
      return;
    }

    toast.success(tToasts("documentUploaded"));
    router.push(`/documents/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {replacesId ? (
        <input type="hidden" name="replaces_id" value={replacesId} />
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">{tCommon("title")}</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={defaultTitle ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document_type">{t("documentType")}</Label>
          <select
            id="document_type"
            name="document_type"
            className={selectClassName}
            defaultValue="agreement"
          >
            {Object.keys(DOCUMENT_TYPE_LABELS).map((value) => (
              <option key={value} value={value}>
                {tType(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="document_date">{t("documentDate")}</Label>
          <Input
            id="document_date"
            name="document_date"
            type="date"
            required
            defaultValue={format(new Date(), "yyyy-MM-dd")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entity_type">{t("linkedTo")}</Label>
          <select
            id="entity_type"
            name="entity_type"
            className={selectClassName}
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
          >
            {Object.keys(DOCUMENT_ENTITY_LABELS)
              .filter((value) => value !== "sale" && value !== "contract")
              .map((value) => (
                <option key={value} value={value}>
                  {tEntity(value)}
                </option>
              ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="entity_id">{t("record")}</Label>
          <select
            id="entity_id"
            name="entity_id"
            key={entityType}
            className={selectClassName}
            defaultValue={defaultEntityId ?? records[0]?.id ?? ""}
            required
          >
            {records.map((row) => (
              <option key={row.id} value={row.id}>
                {row.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="file">{t("fileLabel")}</Label>
          <Input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{tCommon("description")}</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="is_confidential" />
          {t("confidential")}
        </label>
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tForms("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting || !records.length}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {tForms("upload")}
        </Button>
      </div>
    </form>
  );
}
