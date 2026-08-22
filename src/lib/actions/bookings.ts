"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { amountToWords } from "@/lib/amount-to-words";
import {
  postReceiptToCashBook,
  resolveDefaultCashAccount,
} from "@/lib/cash-posting";
import { buildInstallmentPlan, roundMoney } from "@/lib/installments";
import { createNotification } from "@/lib/notifications";
import { canApproveLand, canManageCrm } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";
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
  const isExternal = values.deal_type === "external";

  // Resolve the unit being sold. For a society deal it comes from inventory;
  // for an external (off-society) deal the details are entered by hand and the
  // sale carries no property_id / society_id.
  type SaleUnit = {
    property_id: string | null;
    society_id: string | null;
    plot_no: string;
    property_type: Database["public"]["Enums"]["property_type"];
    area: number;
    area_unit: Database["public"]["Enums"]["area_unit"];
    length_ft: number | null;
    width_ft: number | null;
  };

  let property: {
    id: string;
    society_id: string;
    plot_no: string;
    property_type: Database["public"]["Enums"]["property_type"];
    area: number;
    area_unit: Database["public"]["Enums"]["area_unit"];
    length_ft: number | null;
    width_ft: number | null;
    status: Database["public"]["Enums"]["property_status"];
  } | null = null;
  let unit: SaleUnit;

  if (isExternal) {
    unit = {
      property_id: null,
      society_id: null,
      plot_no: values.ext_plot_no as string,
      property_type: values.ext_property_type as SaleUnit["property_type"],
      area: Number(values.ext_area),
      area_unit: values.ext_area_unit as SaleUnit["area_unit"],
      length_ft: null,
      width_ft: null,
    };
  } else {
    const { data: prop, error: propertyError } = await supabase
      .from("properties")
      .select(
        "id, society_id, plot_no, property_type, area, area_unit, length_ft, width_ft, status",
      )
      .eq("id", values.property_id as string)
      .maybeSingle();

    if (propertyError || !prop) {
      return { error: propertyError?.message ?? "Property not found." };
    }

    if (prop.status !== "available" && prop.status !== "hold") {
      return { error: "This property is not available for booking." };
    }

    property = prop;
    unit = {
      property_id: prop.id,
      society_id: prop.society_id,
      plot_no: prop.plot_no,
      property_type: prop.property_type,
      area: Number(prop.area),
      area_unit: prop.area_unit,
      length_ft: prop.length_ft,
      width_ft: prop.width_ft,
    };
  }

  const saleAmount = roundMoney(values.rate_per_unit * unit.area);
  const tokenAmount = roundMoney(values.token_amount ?? 0);

  if (tokenAmount > saleAmount) {
    return { error: "Token cannot be greater than the sale amount." };
  }

  // Enforce the minimum approved price on inventory units only. Owners and
  // managers may sell below the floor (e.g. an approved discount); everyone
  // else is blocked. External deals have no catalog floor.
  if (property) {
    const { data: cost } = await supabase
      .from("property_costs")
      .select("min_approved_price")
      .eq("property_id", property.id)
      .maybeSingle();

    const minApproved = Number(cost?.min_approved_price ?? 0);
    if (
      minApproved > 0 &&
      saleAmount < minApproved &&
      values.lock_type !== "hold" &&
      !canApproveLand(profile.role)
    ) {
      return {
        error: `Sale price is below the minimum approved price of PKR ${minApproved.toLocaleString()}. A manager must approve a lower price.`,
      };
    }
  }

  const remainingAmount = roundMoney(saleAmount - tokenAmount);
  const bookingDate = format(new Date(), "yyyy-MM-dd");
  const saleStatus =
    values.lock_type === "hold"
      ? "hold"
      : values.payment_type === "emi"
        ? "active_emi"
        : "booked";

  const saleInsert: Database["public"]["Tables"]["sales"]["Insert"] = {
    customer_id: values.customer_id,
    property_id: unit.property_id,
    society_id: unit.society_id,
    plot_no: unit.plot_no,
    property_type: unit.property_type,
    area: unit.area,
    area_unit: unit.area_unit,
    length_ft: unit.length_ft,
    width_ft: unit.width_ft,
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
  };

  // Only external deals write the new columns, so ordinary society bookings
  // keep working even if the external-sales migration has not been run yet.
  if (isExternal) {
    saleInsert.is_external = true;
    saleInsert.external_location = values.ext_location ?? null;
    saleInsert.seller_name = values.ext_seller_name ?? null;
    saleInsert.registry_no = values.ext_registry_no ?? null;
    saleInsert.khata_no = values.ext_khata_no ?? null;
  }

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert(saleInsert)
    .select("id")
    .single();

  if (saleError || !sale) {
    if (saleError?.message.includes("sales_one_active_per_property")) {
      return { error: "This plot already has an active booking." };
    }

    if (
      isExternal &&
      /is_external|external_location|column|schema cache/i.test(
        saleError?.message ?? "",
      )
    ) {
      return {
        error:
          "External sales need a one-time database update. Please run migration 20260822000001_external_sales.sql in Supabase, then try again.",
      };
    }

    return { error: saleError?.message ?? "Could not create booking." };
  }

  // Update property status to hold or booked (society inventory only).
  if (property) {
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
  }

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
          // buildInstallmentPlan numbers the token/down-payment row as
          // installment_no 1 (it is always the first row when a token exists).
          received_amount: tokenAmount > 0 && row.installment_no === 1 ? tokenAmount : 0,
          received_date:
            tokenAmount > 0 && row.installment_no === 1 ? bookingDate : null,
        })),
      )
      .select("id, installment_no");

    if (installmentError) {
      return { error: installmentError.message };
    }

    // If downpayment token was received, create the receipt and allocation record
    if (tokenAmount > 0) {
      const tokenAccountId = await resolveDefaultCashAccount(supabase, "cash");
      const { data: tokenReceipt } = await supabase
        .from("receipts")
        .insert({
          sale_id: sale.id,
          customer_id: values.customer_id,
          cash_account_id: tokenAccountId,
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
        const tokenInst = insertedInstallments.find((inst) => inst.installment_no === 1);
        if (tokenInst) {
          await supabase.from("receipt_allocations").insert({
            receipt_id: tokenReceipt.id,
            installment_id: tokenInst.id,
            allocated_amount: tokenAmount,
          });
        }
      }

      // Post the token collection to the cash book (idempotent, non-fatal).
      if (tokenReceipt && tokenAccountId) {
        await postReceiptToCashBook(supabase, {
          receiptId: tokenReceipt.id,
          cashAccountId: tokenAccountId,
          societyId: unit.society_id,
          amount: tokenAmount,
          date: bookingDate,
          paymentMode: "cash",
          description: isExternal
            ? `Token / downpayment · External · ${unit.plot_no}`
            : `Token / downpayment · Plot ${unit.plot_no}`,
          enteredBy: profile.id,
        });
      }
    }
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${values.customer_id}`);
  revalidatePath("/bookings");
  if (property) {
    revalidatePath("/inventory");
    revalidatePath(`/inventory/${property.id}`);
  }
  revalidatePath("/installments");
  revalidatePath("/receipts");
  revalidatePath("/cash-book");
  revalidatePath("/reports");
  revalidatePath("/dashboard");

  // Surface the new sale to the accounts desk for collection follow-up.
  await createNotification({
    type: "new_sale",
    title: isExternal ? "External sale booked" : "New booking created",
    body: isExternal
      ? `External unit ${unit.plot_no} sold for PKR ${saleAmount.toLocaleString()}.`
      : `Plot ${unit.plot_no} booked for PKR ${saleAmount.toLocaleString()}.`,
    roleTarget: "accounts",
    entityType: "sale",
    entityId: sale.id,
  });

  return { error: null, id: sale.id, customerId: values.customer_id };
}
