"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { postLandPaymentToCashBook } from "@/lib/cash-posting";
import { roundMoney } from "@/lib/installments";
import {
  canApproveLand,
  canManageAccounts,
  canManageInventory,
  canManageLandBank,
} from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  landExchangeSchema,
  landParcelSchema,
  landPaymentSchema,
} from "@/lib/validations/land";

function revalidateLand(id?: string, exchangeId?: string) {
  revalidatePath("/land-bank");
  revalidatePath("/cash-book");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/reports/land-bank");
  if (id) {
    revalidatePath(`/land-bank/${id}`);
  }
  if (exchangeId) {
    revalidatePath(`/land-bank/exchanges/${exchangeId}`);
  }
}

export async function createLandParcel(input: unknown) {
  const parsed = landParcelSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid land details" };
  }

  const { profile } = await requireProfile();

  if (!canManageLandBank(profile.role)) {
    return { error: "You do not have permission to add land records." };
  }

  const values = parsed.data;
  const purchaseValue = roundMoney(
    values.purchase_value > 0
      ? values.purchase_value
      : values.area * values.rate_per_unit,
  );

  if (purchaseValue <= 0 && values.acquisition_type === "purchase") {
    return { error: "Enter a purchase value or rate for this acquisition." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("land_parcels")
    .insert({
      society_id: values.society_id,
      party_id: values.party_id ?? null,
      acquisition_type: values.acquisition_type,
      title: values.title.trim(),
      location: values.location ?? null,
      description: values.description ?? null,
      khasra: values.khasra ?? null,
      khewat: values.khewat ?? null,
      khata: values.khata ?? null,
      mouza: values.mouza ?? null,
      area: values.area,
      area_unit: values.area_unit,
      rate_per_unit: roundMoney(values.rate_per_unit),
      purchase_value: purchaseValue,
      token_amount: roundMoney(values.token_amount ?? 0),
      status: values.status,
      agreement_terms: values.agreement_terms ?? null,
      notes: values.notes ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create land record." };
  }

  revalidateLand(data.id);
  return { error: null, id: data.id };
}

export async function updateLandParcel(id: string, input: unknown) {
  const parsed = landParcelSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid land details" };
  }

  const { profile } = await requireProfile();

  if (!canManageLandBank(profile.role)) {
    return { error: "You do not have permission to edit land records." };
  }

  const supabase = await createClient();

  // Only pre-approval parcels can be edited freely — once acquired, the
  // purchase value drives outstanding-balance maths and must not shift.
  const { data: current, error: loadError } = await supabase
    .from("land_parcels")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !current) {
    return { error: loadError?.message ?? "Land record not found." };
  }

  if (current.status !== "proposed" && current.status !== "under_negotiation") {
    return {
      error: "Only proposed or under-negotiation records can be edited.",
    };
  }

  const values = parsed.data;
  const purchaseValue = roundMoney(
    values.purchase_value > 0
      ? values.purchase_value
      : values.area * values.rate_per_unit,
  );

  if (purchaseValue <= 0 && values.acquisition_type === "purchase") {
    return { error: "Enter a purchase value or rate for this acquisition." };
  }

  const { error } = await supabase
    .from("land_parcels")
    .update({
      society_id: values.society_id,
      party_id: values.party_id ?? null,
      acquisition_type: values.acquisition_type,
      title: values.title.trim(),
      location: values.location ?? null,
      description: values.description ?? null,
      khasra: values.khasra ?? null,
      khewat: values.khewat ?? null,
      khata: values.khata ?? null,
      mouza: values.mouza ?? null,
      area: values.area,
      area_unit: values.area_unit,
      rate_per_unit: roundMoney(values.rate_per_unit),
      purchase_value: purchaseValue,
      token_amount: roundMoney(values.token_amount ?? 0),
      status: values.status,
      agreement_terms: values.agreement_terms ?? null,
      notes: values.notes ?? null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateLand(id);
  return { error: null, id };
}

export async function approveLandParcel(id: string) {
  const { profile } = await requireProfile();

  if (!canApproveLand(profile.role)) {
    return { error: "Only owners and managers can approve land acquisitions." };
  }

  const supabase = await createClient();
  const { data: parcel, error: loadError } = await supabase
    .from("land_parcels")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !parcel) {
    return { error: loadError?.message ?? "Land record not found." };
  }

  if (parcel.status !== "proposed" && parcel.status !== "under_negotiation") {
    return { error: "Only proposed or negotiated records can be approved." };
  }

  const { error } = await supabase
    .from("land_parcels")
    .update({
      status: "approved",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateLand(id);
  return { error: null };
}

export async function createLandPayment(input: unknown) {
  const parsed = landPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid payment details",
    };
  }

  const { profile } = await requireProfile();

  if (!canManageAccounts(profile.role)) {
    return { error: "You do not have permission to post land payments." };
  }

  const supabase = await createClient();
  const values = parsed.data;
  const amount = roundMoney(values.amount);

  const { data: parcel, error: parcelError } = await supabase
    .from("land_parcels")
    .select("id, party_id, society_id, title, paid_amount, remaining_amount, status")
    .eq("id", values.land_parcel_id)
    .maybeSingle();

  if (parcelError || !parcel) {
    return { error: parcelError?.message ?? "Land record not found." };
  }

  if (
    parcel.status !== "approved" &&
    parcel.status !== "partially_paid" &&
    parcel.status !== "fully_paid"
  ) {
    return {
      error: "Approve the acquisition before posting payments.",
    };
  }

  if (amount > Number(parcel.remaining_amount)) {
    return {
      error: `Amount exceeds remaining balance of PKR ${parcel.remaining_amount}.`,
    };
  }

  const { data, error } = await supabase
    .from("land_payments")
    .insert({
      land_parcel_id: parcel.id,
      party_id: parcel.party_id,
      cash_account_id: values.cash_account_id,
      amount,
      payment_date: values.payment_date,
      payment_mode: values.payment_mode,
      reference_no: values.reference_no ?? null,
      notes: values.notes ?? null,
      entered_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not post payment." };
  }

  // Update land parcel paid and remaining balances
  const currentPaid = Number(parcel.paid_amount ?? 0);
  const newPaid = roundMoney(currentPaid + amount);
  const newRemaining = roundMoney(Math.max(0, Number(parcel.remaining_amount) - amount));
  const newStatus = newRemaining <= 0 ? "fully_paid" : "partially_paid";

  await supabase
    .from("land_parcels")
    .update({
      paid_amount: newPaid,
      remaining_amount: newRemaining,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parcel.id);

  // Post the land payment to the cash book as an expense (idempotent, non-fatal).
  await postLandPaymentToCashBook(supabase, {
    landPaymentId: data.id,
    landParcelId: parcel.id,
    partyId: parcel.party_id,
    cashAccountId: values.cash_account_id,
    societyId: parcel.society_id ?? null,
    amount,
    date: values.payment_date,
    paymentMode: values.payment_mode,
    referenceNo: values.reference_no ?? null,
    description: `Land payment · ${parcel.title ?? ""}`.trim(),
    enteredBy: profile.id,
  });

  revalidateLand(parcel.id);
  return { error: null, id: data.id, landId: parcel.id };
}

export async function addLandToInventory(id: string) {
  const { profile } = await requireProfile();

  if (!canManageInventory(profile.role)) {
    return {
      error: "Only inventory managers, managers and owners can add land to inventory.",
    };
  }

  const supabase = await createClient();
  const { data: parcel, error: loadError } = await supabase
    .from("land_parcels")
    .select(
      "id, code, title, khasra, society_id, area, area_unit, purchase_value, acquisition_type, property_id, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (loadError || !parcel) {
    return { error: loadError?.message ?? "Land record not found." };
  }

  if (parcel.property_id) {
    return { error: "This land is already linked to inventory." };
  }

  if (parcel.status === "proposed" || parcel.status === "under_negotiation") {
    return { error: "Approve the land record before adding it to inventory." };
  }

  const plotNo = parcel.khasra?.trim() || parcel.title.slice(0, 40) || parcel.code;
  const ownershipSource =
    parcel.acquisition_type === "exchange_in"
      ? "exchanged"
      : parcel.acquisition_type === "society_owned"
        ? "society_owned"
        : "acquired";

  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      society_id: parcel.society_id,
      property_type: "agricultural_land",
      plot_no: plotNo,
      area: parcel.area,
      area_unit: parcel.area_unit,
      ownership_source: ownershipSource,
      asking_price: parcel.purchase_value,
      internal_notes: `Added from land bank ${parcel.code}`,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !property) {
    return { error: error?.message ?? "Could not create inventory unit." };
  }

  const { error: costError } = await supabase
    .from("property_costs")
    .upsert(
      { property_id: property.id, acquisition_cost: parcel.purchase_value },
      { onConflict: "property_id" },
    );

  if (costError) {
    return { error: costError.message };
  }

  const { error: linkError } = await supabase
    .from("land_parcels")
    .update({ property_id: property.id })
    .eq("id", parcel.id);

  if (linkError) {
    return { error: linkError.message };
  }

  revalidateLand(parcel.id);
  revalidatePath(`/inventory/${property.id}`);
  return { error: null, propertyId: property.id };
}

export async function createLandExchange(input: unknown) {
  const parsed = landExchangeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid exchange details",
    };
  }

  const { profile } = await requireProfile();

  if (!canManageLandBank(profile.role)) {
    return { error: "You do not have permission to record land exchanges." };
  }

  const values = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("land_exchanges")
    .insert({
      society_id: values.society_id,
      party_id: values.party_id,
      outgoing_property_id: values.outgoing_property_id ?? null,
      outgoing_land_id: values.outgoing_land_id ?? null,
      incoming_title: values.incoming_title.trim(),
      incoming_location: values.incoming_location ?? null,
      incoming_description: values.incoming_description ?? null,
      incoming_area: values.incoming_area,
      incoming_area_unit: values.incoming_area_unit,
      incoming_khasra: values.incoming_khasra ?? null,
      incoming_khewat: values.incoming_khewat ?? null,
      incoming_khata: values.incoming_khata ?? null,
      incoming_mouza: values.incoming_mouza ?? null,
      outgoing_value: roundMoney(values.outgoing_value),
      incoming_value: roundMoney(values.incoming_value),
      token_amount: roundMoney(values.token_amount ?? 0),
      agreement_terms: values.agreement_terms ?? null,
      notes: values.notes ?? null,
      status: "draft",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create exchange deal." };
  }

  revalidateLand(undefined, data.id);
  return { error: null, id: data.id };
}

export async function approveLandExchange(id: string) {
  const { profile } = await requireProfile();

  if (!canApproveLand(profile.role)) {
    return { error: "Only owners and managers can approve exchanges." };
  }

  const supabase = await createClient();
  const { data: deal, error: loadError } = await supabase
    .from("land_exchanges")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !deal) {
    return { error: loadError?.message ?? "Exchange not found." };
  }

  if (deal.status !== "draft" && deal.status !== "pending_approval") {
    return { error: "Only draft exchanges can be approved." };
  }

  const { error } = await supabase
    .from("land_exchanges")
    .update({
      status: "approved",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateLand(undefined, id);
  return { error: null };
}

export async function completeLandExchange(id: string) {
  const { profile } = await requireProfile();

  if (!canManageLandBank(profile.role)) {
    return { error: "You do not have permission to complete exchanges." };
  }

  const supabase = await createClient();
  const { data: deal, error: loadError } = await supabase
    .from("land_exchanges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !deal) {
    return { error: loadError?.message ?? "Exchange not found." };
  }

  if (deal.status !== "approved") {
    return { error: "Approve the exchange before completing it." };
  }

  if (deal.incoming_land_id) {
    return { error: "This exchange is already completed." };
  }

  if (deal.outgoing_property_id && !canManageInventory(profile.role)) {
    return {
      error:
        "Completing an exchange that transfers inventory requires an inventory manager or owner.",
    };
  }

  const difference = roundMoney(
    Number(deal.incoming_value) - Number(deal.outgoing_value),
  );
  const cashPayable = Math.max(difference, 0);

  const { data: parcel, error: parcelError } = await supabase
    .from("land_parcels")
    .insert({
      society_id: deal.society_id,
      party_id: deal.party_id,
      exchange_id: deal.id,
      acquisition_type: "exchange_in",
      title: deal.incoming_title,
      location: deal.incoming_location,
      description: deal.incoming_description,
      khasra: deal.incoming_khasra,
      khewat: deal.incoming_khewat,
      khata: deal.incoming_khata,
      mouza: deal.incoming_mouza,
      area: deal.incoming_area,
      area_unit: deal.incoming_area_unit,
      rate_per_unit: 0,
      purchase_value: cashPayable,
      token_amount: roundMoney(deal.token_amount),
      status: cashPayable > 0 ? "approved" : "fully_paid",
      agreement_terms: deal.agreement_terms,
      notes: [
        deal.notes,
        `Received in exchange ${deal.code}. Incoming value ${deal.incoming_value}, outgoing value ${deal.outgoing_value}.`,
      ]
        .filter(Boolean)
        .join("\n"),
      approved_by: deal.approved_by,
      approved_at: deal.approved_at,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (parcelError || !parcel) {
    return { error: parcelError?.message ?? "Could not add received land." };
  }

  if (deal.outgoing_property_id) {
    const { error: propertyError } = await supabase
      .from("properties")
      .update({
        status: "transferred",
        hold_reason: `Exchanged under ${deal.code}`,
      })
      .eq("id", deal.outgoing_property_id);

    if (propertyError) {
      return { error: propertyError.message };
    }
  }

  if (deal.outgoing_land_id) {
    const { error: landError } = await supabase
      .from("land_parcels")
      .update({ status: "transferred" })
      .eq("id", deal.outgoing_land_id);

    if (landError) {
      return { error: landError.message };
    }
  }

  const { error } = await supabase
    .from("land_exchanges")
    .update({
      incoming_land_id: parcel.id,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", deal.id);

  if (error) {
    return { error: error.message };
  }

  revalidateLand(parcel.id, deal.id);
  return { error: null, landId: parcel.id };
}

export async function deleteLandParcel(id: string): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageLandBank(profile.role)) return;
  const supabase = await createClient();
  await supabase.from("land_parcels").delete().eq("id", id);
  revalidateLand();
}
