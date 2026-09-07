"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Calendar,
  CheckCircle,
  Coins,
  DollarSign,
  Globe2,
  Layers,
  Loader2,
  Percent,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createBooking } from "@/lib/actions/bookings";
import {
  AREA_UNIT_LABELS,
  PAYMENT_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { formatNumber, formatPkr } from "@/lib/format";
import { buildInstallmentPlan, roundMoney } from "@/lib/installments";
import {
  bookingSchema,
  type BookingFormValues,
} from "@/lib/validations/booking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-9 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

type PropertyOption = {
  id: string;
  code: string;
  plot_no: string;
  property_type: keyof typeof PROPERTY_TYPE_LABELS;
  area: number;
  area_unit: keyof typeof AREA_UNIT_LABELS;
  asking_price: number | null;
  status: string;
};

export function BookingForm({
  customerId,
  customers,
  properties,
  defaultPropertyId,
}: {
  customerId?: string;
  customers: { id: string; code: string; full_name: string }[];
  properties: PropertyOption[];
  defaultPropertyId?: string;
}) {
  const router = useRouter();
  const t = useTranslations("bookings");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tType = useTranslations("labels.propertyType");
  const tUnit = useTranslations("labels.areaUnit");
  const tPayType = useTranslations("labels.paymentType");
  const tStatus = useTranslations("labels.propertyStatus");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      deal_type: "society",
      customer_id: customerId ?? customers[0]?.id ?? "",
      property_id: defaultPropertyId ?? properties[0]?.id ?? "",
      ext_property_type: "residential_plot",
      ext_plot_no: "",
      ext_area: undefined,
      ext_area_unit: "marla",
      ext_location: "",
      ext_seller_name: "",
      ext_registry_no: "",
      ext_khata_no: "",
      lock_type: "booked",
      rate_per_unit: undefined,
      token_amount: 0,
      payment_type: "emi",
      term_months: 12,
      balloon_mode: "none",
      balloon_interval: 0,
      balloon_amount: 0,
      custom_balloon_months: "",
      possession_amount: 0,
      agreement_date: "",
      agreement_terms: "",
      notes: "",
    },
  });

  const dealType = watch("deal_type");
  const propertyId = watch("property_id");
  const rate = Number(watch("rate_per_unit") || 0);
  const token = Number(watch("token_amount") || 0);
  const paymentType = watch("payment_type");
  const termMonths = Number(watch("term_months") || 0);
  const balloonMode = watch("balloon_mode");
  const balloonAmount = Number(watch("balloon_amount") || 0);
  const customBalloonMonths = watch("custom_balloon_months");
  const possessionAmount = Number(watch("possession_amount") || 0);

  const property = properties.find((item) => item.id === propertyId);
  const extArea = Number(watch("ext_area") || 0);
  const areaForCalc =
    dealType === "external" ? extArea : property ? Number(property.area) : 0;
  const saleAmount = roundMoney(rate * areaForCalc);
  const remaining = roundMoney(Math.max(0, saleAmount - token));

  const parsedCustomMonths = useMemo(() => {
    if (!customBalloonMonths) return undefined;
    return customBalloonMonths
      .split(/[\s,]+/)
      .map((m) => parseInt(m.trim(), 10))
      .filter((m) => !isNaN(m) && m > 0);
  }, [customBalloonMonths]);

  const preview = useMemo(
    () =>
      buildInstallmentPlan({
        saleAmount,
        tokenAmount: token,
        paymentType,
        termMonths,
        bookingDate: new Date().toISOString().slice(0, 10),
        balloonMode,
        balloonAmount,
        customBalloonMonths: parsedCustomMonths,
        possessionAmount,
      }),
    [
      saleAmount,
      token,
      paymentType,
      termMonths,
      balloonMode,
      balloonAmount,
      parsedCustomMonths,
      possessionAmount,
    ],
  );

  async function onSubmit(values: BookingFormValues) {
    const result = await createBooking(values);

    if (result.error || !result.customerId) {
      toast.error(result.error ?? tToasts("couldNotCreateBooking"));
      return;
    }

    toast.success(tToasts("bookingCreated"));
    router.push(`/customers/${result.customerId}`);
    router.refresh();
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
      {/* Property & Customer Basic Selection */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b pb-3">
          <Building2 className="size-4 text-primary" />
          <h2 className="font-semibold text-base">{t("sectionTitle")}</h2>
        </div>

        <div className="space-y-2">
          <Label>{t("dealType")}</Label>
          <div className="inline-flex rounded-[8px] border p-1 bg-muted/30">
            {(
              [
                { value: "society", label: t("dealSociety"), Icon: Building2 },
                { value: "external", label: t("dealExternal"), Icon: Globe2 },
              ] as const
            ).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue("deal_type", value)}
                className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
                  dealType === value
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {dealType === "external" ? t("dealExternalHint") : t("dealSocietyHint")}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_id">{t("selectCustomer")}</Label>
            <select
              id="customer_id"
              className={selectClassName}
              {...register("customer_id")}
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.code} · {customer.full_name}
                </option>
              ))}
            </select>
          </div>

          {dealType === "society" ? (
            <>
              {properties.length ? (
                <div className="space-y-2">
                  <Label htmlFor="property_id">{t("selectProperty")}</Label>
                  <select
                    id="property_id"
                    className={selectClassName}
                    {...register("property_id")}
                  >
                    {properties.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} · {t("plotHash", { plot: item.plot_no })} ({tStatus(item.status)})
                      </option>
                    ))}
                  </select>
                  {errors.property_id ? (
                    <p className="text-xs text-destructive">{errors.property_id.message}</p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("propertyUnit")}</Label>
                  <p className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                    {t("noInventory")}
                  </p>
                </div>
              )}

              {property ? (
                <div className="rounded-md bg-muted/40 p-3 sm:col-span-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-foreground">
                    {tType(property.property_type)} · {t("plotHash", { plot: property.plot_no })}
                  </span>
                  <span className="text-muted-foreground">
                    {t("size", { area: formatNumber(property.area), unit: tUnit(property.area_unit) })}
                  </span>
                  {property.asking_price ? (
                    <span className="font-semibold text-primary">
                      {t("catalogAsking", { amount: formatPkr(property.asking_price) })}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="ext_property_type">{t("unitType")}</Label>
                <select
                  id="ext_property_type"
                  className={selectClassName}
                  {...register("ext_property_type")}
                >
                  {Object.keys(PROPERTY_TYPE_LABELS).map((value) => (
                    <option key={value} value={value}>
                      {tType(value)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ext_plot_no">{t("plotUnitNo")}</Label>
                <Input
                  id="ext_plot_no"
                  placeholder={t("plotUnitPlaceholder")}
                  className="rounded-[8px]"
                  {...register("ext_plot_no")}
                />
                {errors.ext_plot_no ? (
                  <p className="text-xs text-destructive">
                    {String(errors.ext_plot_no.message)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ext_area">{t("areaSize")}</Label>
                <Input
                  id="ext_area"
                  type="number"
                  step="any"
                  placeholder={t("areaPlaceholder")}
                  className="rounded-[8px]"
                  {...register("ext_area")}
                />
                {errors.ext_area ? (
                  <p className="text-xs text-destructive">
                    {String(errors.ext_area.message)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ext_area_unit">{t("areaUnit")}</Label>
                <select
                  id="ext_area_unit"
                  className={selectClassName}
                  {...register("ext_area_unit")}
                >
                  {Object.keys(AREA_UNIT_LABELS).map((value) => (
                    <option key={value} value={value}>
                      {tUnit(value)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ext_location">{t("location")}</Label>
                <Input
                  id="ext_location"
                  placeholder={t("locationPlaceholder")}
                  className="rounded-[8px]"
                  {...register("ext_location")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ext_seller_name">{t("seller")}</Label>
                <Input
                  id="ext_seller_name"
                  placeholder={t("sellerPlaceholder")}
                  className="rounded-[8px]"
                  {...register("ext_seller_name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ext_registry_no">{t("registryNo")}</Label>
                <Input
                  id="ext_registry_no"
                  placeholder={t("registryPlaceholder")}
                  className="rounded-[8px]"
                  {...register("ext_registry_no")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ext_khata_no">{t("khataNo")}</Label>
                <Input
                  id="ext_khata_no"
                  placeholder={t("khataPlaceholder")}
                  className="rounded-[8px]"
                  {...register("ext_khata_no")}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="lock_type">{t("lockType")}</Label>
            <select id="lock_type" className={selectClassName} {...register("lock_type")}>
              <option value="booked">{t("lockBooked")}</option>
              <option value="hold">{t("lockHold")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_per_unit">{t("ratePerUnit")}</Label>
            <Input
              id="rate_per_unit"
              type="number"
              step="1"
              placeholder={t("ratePlaceholder")}
              className="rounded-[8px]"
              {...register("rate_per_unit")}
            />
            {errors.rate_per_unit ? (
              <p className="text-xs text-destructive">
                {String(errors.rate_per_unit.message)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="token_amount">{t("token")}</Label>
            <Input
              id="token_amount"
              type="number"
              step="1"
              placeholder={t("tokenPlaceholder")}
              className="rounded-[8px]"
              {...register("token_amount")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_type">{t("paymentMode")}</Label>
            <select
              id="payment_type"
              className={selectClassName}
              {...register("payment_type")}
            >
              {Object.keys(PAYMENT_TYPE_LABELS).map((value) => (
                <option key={value} value={value}>
                  {tPayType(value)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Installment Plan & Balloon Payment Setup (If EMI) */}
      {paymentType === "emi" && (
        <div className="rounded-[10px] border border-primary/30 bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-primary" />
              <h2 className="font-semibold text-base">{t("planTitle")}</h2>
            </div>
            <Badge variant="secondary" className="rounded-md">
              {t("emiBadge")}
            </Badge>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="term_months">{t("termMonths")}</Label>
              <Input
                id="term_months"
                type="number"
                min="2"
                placeholder={t("termPlaceholder")}
                className="rounded-[8px]"
                {...register("term_months")}
              />
              <p className="text-xs text-muted-foreground">{t("termHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balloon_mode">{t("balloonFreq")}</Label>
              <select
                id="balloon_mode"
                className={selectClassName}
                {...register("balloon_mode")}
              >
                <option value="none">{t("balloonNone")}</option>
                <option value="every_3_months">{t("balloon3")}</option>
                <option value="every_6_months">{t("balloon6")}</option>
                <option value="every_12_months">{t("balloon12")}</option>
                <option value="custom">{t("balloonCustom")}</option>
              </select>
            </div>

            {balloonMode !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="balloon_amount">{t("balloonAmount")}</Label>
                <Input
                  id="balloon_amount"
                  type="number"
                  step="1"
                  placeholder="e.g. 100000"
                  className="rounded-[8px]"
                  {...register("balloon_amount")}
                />
                <p className="text-xs text-muted-foreground">{t("balloonAmountHint")}</p>
              </div>
            )}

            {balloonMode === "custom" && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="custom_balloon_months">{t("customMonths")}</Label>
                <Input
                  id="custom_balloon_months"
                  placeholder={t("customMonthsPlaceholder")}
                  className="rounded-[8px]"
                  {...register("custom_balloon_months")}
                />
                <p className="text-xs text-muted-foreground">{t("customMonthsHint")}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="possession_amount">{t("possession")}</Label>
              <Input
                id="possession_amount"
                type="number"
                step="1"
                placeholder="e.g. 250000"
                className="rounded-[8px]"
                {...register("possession_amount")}
              />
              <p className="text-xs text-muted-foreground">{t("possessionHint")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Valuation Summary Bar */}
      <div className="rounded-[10px] border bg-muted/30 p-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t("totalSale")}</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{formatPkr(saleAmount)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t("tokenDown")}</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatPkr(token)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t("netBalance")}</p>
          <p className="text-xl font-bold text-primary mt-0.5">{formatPkr(remaining)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t("scheduleMilestones")}</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{t("vouchers", { count: preview.length })}</p>
        </div>
      </div>

      {/* Legal Agreement & CRM Notes */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Calendar className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-base">{t("agreementTitle")}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agreement_date">{t("agreementDate")}</Label>
            <Input id="agreement_date" type="date" className="rounded-[8px]" {...register("agreement_date")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="agreement_terms">{t("agreementTerms")}</Label>
            <Textarea id="agreement_terms" rows={3} placeholder={t("agreementPlaceholder")} className="rounded-[8px]" {...register("agreement_terms")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">{t("internalNotes")}</Label>
            <Textarea id="notes" rows={2} placeholder={t("notesPlaceholder")} className="rounded-[8px]" {...register("notes")} />
          </div>
        </div>
      </div>

      {/* Live Installment & Additional Payment Schedule Preview */}
      {preview.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-primary" />
              <h2 className="font-semibold text-sm">{t("previewTitle")}</h2>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {t("scheduledPayments", { count: preview.length })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t("colPeriod")}</th>
                  <th className="px-4 py-3">{t("colDueDate")}</th>
                  <th className="px-4 py-3">{t("colRegularEmi")}</th>
                  <th className="px-4 py-3">{t("colBalloon")}</th>
                  <th className="px-4 py-3 text-right">{t("colTotalDue")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {preview.map((row) => (
                  <tr
                    key={row.installment_no}
                    className={`hover:bg-muted/30 transition-colors ${
                      row.is_balloon ? "bg-amber-500/5 font-medium" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold">#{row.installment_no}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{row.period_label}</span>
                        {row.is_balloon && (
                          <Badge variant="secondary" className="rounded-md text-[10px] px-1.5 py-0">
                            {t("milestoneBadge")}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.due_date}</td>
                    <td className="px-4 py-3 font-medium">{formatPkr(row.regular_amount)}</td>
                    <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                      {row.additional_amount > 0 ? formatPkr(row.additional_amount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {formatPkr(row.scheduled_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Action Bar */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tForms("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || (dealType === "society" && !properties.length)}
        >
          {isSubmitting ? <Loader2 className="animate-spin size-4 mr-2" /> : <CheckCircle className="size-4 mr-2" />}
          {tForms("confirmBooking")}
        </Button>
      </div>
    </form>
  );
}
