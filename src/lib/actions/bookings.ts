"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { amountToWords } from "@/lib/amount-to-words";
import { buildInstallmentPlan, roundMoney } from "@/lib/installments";
import { canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { bookingSchema } from "@/lib/validations/booking";

export async function createBooking(input: unknown) {
  const parsed = bookingSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking details" };
  }

  const { profile } = await requireProfile();

  if (!canManageCrm(profile.role)) {
    return { error: "You do not have permission to create bookings." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select(
      "id, society_id, plot_no, property_type, area, area_unit, length_ft, width_ft, status",
    )
    .eq("id", values.property_id)
    .maybeSingle();

  if (propertyError || !property) {
    return { error: propertyError?.message ?? "Property not found." };
  }

  if (property.status !== "available" && property.status !== "hold") {
    return { error: "This property is not available for booking." };
  }

  const saleAmount = roundMoney(values.rate_per_unit * Number(property.area));
  const tokenAmount = roundMoney(values.token_amount ?? 0);

  if (tokenAmount > saleAmount) {
    return { error: "Token cannot be greater than the sale amount." };
  }

  const remainingAmount = roundMoney(saleAmount - tokenAmount);
  const bookingDate = format(new Date(), "yyyy-MM-dd");
  const saleStatus =
    values.lock_type === "hold"
      ? "hold"
      : values.payment_type === "emi"
        ? "active_emi"
        : "booked";

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      customer_id: values.customer_id,
      property_id: property.id,
      society_id: property.society_id,
      plot_no: property.plot_no,
      property_type: property.property_type,
      area: property.area,
      area_unit: property.area_unit,
      length_ft: property.length_ft,
      width_ft: property.width_ft,
      rate_per_unit: values.rate_per_unit,
      sale_amount: saleAmount,
      token_amount: tokenAmount,
      remaining_amount: remainingAmount,
      payment_type: values.payment_type,
      term_months: values.payment_type === "emi" ? values.term_months : 0,
      agreement_date: values.agreement_date ?? null,
      agreement_terms: values.agreement_terms ?? null,
      notes: values.notes ?? null,
      status: saleStatus,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (saleError || !sale) {
    if (saleError?.message.includes("sales_one_active_per_property")) {
      return { error: "This plot already has an active booking." };
    }

    return { error: saleError?.message ?? "Could not create booking." };
  }

  // Update property status to hold or booked
  const targetPropertyStatus = saleStatus === "hold" ? "hold" : "booked";
  await supabase
    .from("properties")
    .update({ status: targetPropertyStatus, updated_at: new Date().toISOString() })
    .eq("id", property.id);

  // Record property status transition
  await supabase.from("property_status_history").insert({
    property_id: property.id,
    from_status: property.status,
    to_status: targetPropertyStatus,
    changed_by: profile.id,
    reason: `Plot booked via sales booking (Sale ID: ${sale.id})`,
  });

  // Promote customer stage
  const customerTargetStage = values.payment_type === "emi" ? "active_emi" : "booked";
  await supabase
    .from("customers")
    .update({ stage: customerTargetStage, updated_at: new Date().toISOString() })
    .eq("id", values.customer_id);

  let customMonths: number[] | undefined = undefined;
  if (values.custom_balloon_months) {
    customMonths = values.custom_balloon_months
      .split(/[\s,]+/)
      .map((m) => parseInt(m.trim(), 10))
      .filter((m) => !isNaN(m) && m > 0);
  }

  const schedule = buildInstallmentPlan({
    saleAmount,
    tokenAmount,
    paymentType: values.payment_type,
    termMonths: values.term_months,
    bookingDate,
    balloonMode: values.balloon_mode,
    balloonInterval: values.balloon_interval,
    balloonAmount: values.balloon_amount,
    customBalloonMonths: customMonths,
    possessionAmount: values.possession_amount,
  });

  if (schedule.length) {
    const { data: insertedInstallments, error: installmentError } = await supabase
      .from("installments")
      .insert(
        schedule.map((row) => ({
          sale_id: sale.id,
          installment_no: row.installment_no,
          period_label: row.period_label,
          due_date: row.due_date,
          scheduled_amount: row.scheduled_amount,
          received_amount: row.installment_no === 0 ? tokenAmount : 0,
          received_date: row.installment_no === 0 && tokenAmount > 0 ? bookingDate : null,
        })),
      )
      .select("id, installment_no");

    if (installmentError) {
      return { error: installmentError.message };
    }

    // If downpayment token was received, create the receipt and allocation record
    if (tokenAmount > 0) {
      const { data: tokenReceipt } = await supabase
        .from("receipts")
        .insert({
          sale_id: sale.id,
          customer_id: values.customer_id,
          payment_date: bookingDate,
          amount: tokenAmount,
          amount_in_words: amountToWords(tokenAmount),
          payment_mode: "cash",
          notes: "Initial downpayment / token receipt",
          received_by: profile.id,
        })
        .select("id")
        .single();

      if (tokenReceipt && insertedInstallments) {
        const tokenInst = insertedInstallments.find((inst) => inst.installment_no === 0);
        if (tokenInst) {
          await supabase.from("receipt_allocations").insert({
            receipt_id: tokenReceipt.id,
            installment_id: tokenInst.id,
            allocated_amount: tokenAmount,
          });
        }
      }
    }
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${values.customer_id}`);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${property.id}`);
  revalidatePath("/installments");
  revalidatePath("/receipts");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { error: null, id: sale.id, customerId: values.customer_id };
}
