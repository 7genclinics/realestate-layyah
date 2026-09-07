"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createLead, updateLead } from "@/lib/actions/leads";
import {
  CUSTOMER_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/constants";
import { leadSchema, type LeadFormValues } from "@/lib/validations/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-9 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

type Option = { id: string; name: string };

export function LeadForm({
  leadId,
  defaultValues,
  societies,
  agents,
}: {
  leadId?: string;
  defaultValues?: Partial<LeadFormValues>;
  societies: Option[];
  agents: Option[];
}) {
  const router = useRouter();
  const t = useTranslations("leads");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tSource = useTranslations("labels.customerSource");
  const tStatus = useTranslations("labels.leadStatus");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      source: "walk_in",
      status: "new",
      society_id: "",
      agent_id: "",
      interest: "",
      budget: undefined,
      notes: "",
      ...defaultValues,
    },
  });

  async function onSubmit(values: LeadFormValues) {
    const result = leadId
      ? await updateLead(leadId, values)
      : await createLead(values);

    if (result.error || !result.id) {
      toast.error(result.error ?? tToasts("couldNotSaveLead"));
      return;
    }

    toast.success(leadId ? tToasts("leadUpdated") : tToasts("leadCreated"));
    router.push(`/leads/${result.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="full_name">{t("name")}</Label>
          <Input id="full_name" {...register("full_name")} />
          {errors.full_name ? (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{tCommon("phone")}</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">{t("budget")}</Label>
          <Input id="budget" type="number" step="1" {...register("budget")} />
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
          <Label htmlFor="status">{t("pipelineStatus")}</Label>
          <select id="status" className={selectClassName} {...register("status")}>
            {Object.keys(LEAD_STATUS_LABELS).map((value) => (
              <option key={value} value={value}>
                {tStatus(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="society_id">{t("interestedSociety")}</Label>
          <select id="society_id" className={selectClassName} {...register("society_id")}>
            <option value="">{t("anyUnspecified")}</option>
            {societies.map((soc) => (
              <option key={soc.id} value={soc.id}>
                {soc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent_id">{t("referringAgent")}</Label>
          <select id="agent_id" className={selectClassName} {...register("agent_id")}>
            <option value="">{t("none")}</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="interest">{t("interest")}</Label>
          <Input
            id="interest"
            placeholder={t("interestPlaceholder")}
            {...register("interest")}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">{tCommon("notes")}</Label>
          <Textarea id="notes" rows={3} {...register("notes")} />
        </div>
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tForms("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {leadId ? tForms("saveLead") : tForms("createLead")}
        </Button>
      </div>
    </form>
  );
}
