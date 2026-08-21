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
  Layers,
  Loader2,
  Percent,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
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
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_id: customerId ?? customers[0]?.id ?? "",
      property_id: defaultPropertyId ?? properties[0]?.id ?? "",
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
  const saleAmount = property ? roundMoney(rate * Number(property.area)) : 0;
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
      toast.error(result.error ?? "Could not create booking");
      return;
    }

    toast.success("Booking created and installment schedule initialized");
    router.push(`/customers/${result.customerId}`);
    router.refresh();
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
      {/* Property & Customer Basic Selection */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b pb-3">
          <Building2 className="size-4 text-primary" />
          <h2 className="font-semibold text-base">Booking &amp; Unit Allocation</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_id">Select Customer Buyer *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="property_id">Select Property Unit *</Label>
            <select
              id="property_id"
              className={selectClassName}
              {...register("property_id")}
            >
              {properties.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · Plot #{item.plot_no} ({item.status})
                </option>
              ))}
            </select>
            {errors.property_id ? (
              <p className="text-xs text-destructive">{errors.property_id.message}</p>
            ) : null}
          </div>

          {property ? (
            <div className="rounded-md bg-muted/40 p-3 sm:col-span-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-medium text-foreground">
                {PROPERTY_TYPE_LABELS[property.property_type]} · Plot #{property.plot_no}
              </span>
              <span className="text-muted-foreground">
                Size: {formatNumber(property.area)} {AREA_UNIT_LABELS[property.area_unit]}
              </span>
              {property.asking_price ? (
                <span className="font-semibold text-primary">
                  Catalog Asking: {formatPkr(property.asking_price)}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="lock_type">Unit Lock Type</Label>
            <select id="lock_type" className={selectClassName} {...register("lock_type")}>
              <option value="booked">Booked (Firm Allocation)</option>
              <option value="hold">Hold (Temporary Reservation)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_per_unit">Rate per unit area (PKR) *</Label>
            <Input
              id="rate_per_unit"
              type="number"
              step="1"
              placeholder="e.g. 350000 per Marla"
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
            <Label htmlFor="token_amount">Down Payment / Token (PKR)</Label>
            <Input
              id="token_amount"
              type="number"
              step="1"
              placeholder="e.g. 500000"
              className="rounded-[8px]"
              {...register("token_amount")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_type">Payment Mode</Label>
            <select
              id="payment_type"
              className={selectClassName}
              {...register("payment_type")}
            >
              {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
              <h2 className="font-semibold text-base">Installment Plan &amp; Periodic Additional Payments</h2>
            </div>
            <Badge variant="secondary" className="rounded-md">
              EMI Schedule Generator
            </Badge>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="term_months">Total EMI Duration (Months) *</Label>
              <Input
                id="term_months"
                type="number"
                min="2"
                placeholder="e.g. 12, 24, 36"
                className="rounded-[8px]"
                {...register("term_months")}
              />
              <p className="text-xs text-muted-foreground">Standard duration in months (e.g. 12, 24, 36, 48)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balloon_mode">Additional Periodic Payment Frequency</Label>
              <select
                id="balloon_mode"
                className={selectClassName}
                {...register("balloon_mode")}
              >
                <option value="none">None (Equal Monthly Installments Only)</option>
                <option value="every_3_months">Every 3 Months (Quarterly Additional Payment)</option>
                <option value="every_6_months">Every 6 Months (Semi-Annual Additional Payment)</option>
                <option value="every_12_months">Every 12 Months (Annual Additional Payment)</option>
                <option value="custom">Custom Milestone Months (e.g. 3, 6, 9, 12...)</option>
              </select>
            </div>

            {balloonMode !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="balloon_amount">Additional Payment Amount (PKR) *</Label>
                <Input
                  id="balloon_amount"
                  type="number"
                  step="1"
                  placeholder="e.g. 100000"
                  className="rounded-[8px]"
                  {...register("balloon_amount")}
                />
                <p className="text-xs text-muted-foreground">Added to regular monthly EMI on scheduled milestone months</p>
              </div>
            )}

            {balloonMode === "custom" && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="custom_balloon_months">Custom Additional Payment Months</Label>
                <Input
                  id="custom_balloon_months"
                  placeholder="e.g. 3, 6, 9, 12, 18, 24"
                  className="rounded-[8px]"
                  {...register("custom_balloon_months")}
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of month numbers where additional payment applies</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="possession_amount">Lump Sum on Possession / Ballot (PKR)</Label>
              <Input
                id="possession_amount"
                type="number"
                step="1"
                placeholder="e.g. 250000"
                className="rounded-[8px]"
                {...register("possession_amount")}
              />
              <p className="text-xs text-muted-foreground">Optional final milestone due at handover / last month</p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Valuation Summary Bar */}
      <div className="rounded-[10px] border bg-muted/30 p-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Total Sale Value</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{formatPkr(saleAmount)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Token / Down Payment</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatPkr(token)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Net Installment Balance</p>
          <p className="text-xl font-bold text-primary mt-0.5">{formatPkr(remaining)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Schedule Milestones</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{preview.length} vouchers</p>
        </div>
      </div>

      {/* Legal Agreement & CRM Notes */}
      <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Calendar className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-base">Agreement Terms &amp; CRM Remarks</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agreement_date">Agreement Date</Label>
            <Input id="agreement_date" type="date" className="rounded-[8px]" {...register("agreement_date")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="agreement_terms">Agreement Terms &amp; Conditions</Label>
            <Textarea id="agreement_terms" rows={3} placeholder="Terms of booking, possession timeline, transfer conditions..." className="rounded-[8px]" {...register("agreement_terms")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea id="notes" rows={2} placeholder="Internal agent notes or buyer remarks..." className="rounded-[8px]" {...register("notes")} />
          </div>
        </div>
      </div>

      {/* Live Installment & Additional Payment Schedule Preview */}
      {preview.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-primary" />
              <h2 className="font-semibold text-sm">Generated Installment &amp; Milestone Schedule Preview</h2>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {preview.length} scheduled payments
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Period / Description</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Regular EMI</th>
                  <th className="px-4 py-3">Additional / Balloon</th>
                  <th className="px-4 py-3 text-right">Total Scheduled Due</th>
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
                            Milestone + Additional
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
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !properties.length}>
          {isSubmitting ? <Loader2 className="animate-spin size-4 mr-2" /> : <CheckCircle className="size-4 mr-2" />}
          Confirm Booking &amp; Save Schedule
        </Button>
      </div>
    </form>
  );
}
