"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { logActivity, logAudit } from "@/lib/audit";
import { canManageLeads } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { leadSchema, leadStatusSchema } from "@/lib/validations/lead";

export async function createLead(input: unknown) {
  const parsed = leadSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lead details" };
  }

  const { profile } = await requireProfile();

  if (!canManageLeads(profile.role)) {
    return { error: "You do not have permission to add leads." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      full_name: values.full_name.trim(),
      phone: values.phone ?? null,
      source: values.source,
      status: values.status,
      society_id: values.society_id || null,
      agent_id: values.agent_id || null,
      interest: values.interest ?? null,
      budget: values.budget ?? null,
      notes: values.notes ?? null,
      assigned_to: profile.id,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create lead." };
  }

  await logAudit({
    action: "create",
    entityType: "lead",
    entityId: data.id,
    summary: `Lead "${values.full_name.trim()}" added`,
    actorId: profile.id,
  });
  await logActivity({
    entityType: "lead",
    entityId: data.id,
    activityType: "note",
    subject: "Lead created",
    body: values.interest ?? null,
    actorId: profile.id,
  });

  revalidatePath("/leads");
  return { error: null, id: data.id };
}

export async function updateLead(id: string, input: unknown) {
  const parsed = leadSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lead details" };
  }

  const { profile } = await requireProfile();

  if (!canManageLeads(profile.role)) {
    return { error: "You do not have permission to edit leads." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { error } = await supabase
    .from("leads")
    .update({
      full_name: values.full_name.trim(),
      phone: values.phone ?? null,
      source: values.source,
      status: values.status,
      society_id: values.society_id || null,
      agent_id: values.agent_id || null,
      interest: values.interest ?? null,
      budget: values.budget ?? null,
      notes: values.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "update",
    entityType: "lead",
    entityId: id,
    summary: `Lead "${values.full_name.trim()}" updated`,
    actorId: profile.id,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { error: null, id };
}

export async function updateLeadStatus(input: unknown) {
  const parsed = leadStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status" };
  }

  const { profile } = await requireProfile();

  if (!canManageLeads(profile.role)) {
    return { error: "You do not have permission to update leads." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { error } = await supabase
    .from("leads")
    .update({ status: values.status, updated_at: new Date().toISOString() })
    .eq("id", values.lead_id);

  if (error) {
    return { error: error.message };
  }

  await logActivity({
    entityType: "lead",
    entityId: values.lead_id,
    activityType: "status_change",
    subject: `Moved to ${values.status}`,
    body: values.note ?? null,
    actorId: profile.id,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${values.lead_id}`);
  return { error: null };
}

export async function convertLeadToCustomer(id: string) {
  const { profile } = await requireProfile();

  if (!canManageLeads(profile.role)) {
    return { error: "You do not have permission to convert leads." };
  }

  const supabase = await createClient();

  const { data: lead, error: loadError } = await supabase
    .from("leads")
    .select("id, full_name, phone, source, notes, converted_customer_id")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !lead) {
    return { error: loadError?.message ?? "Lead not found." };
  }

  if (lead.converted_customer_id) {
    return { error: "This lead has already been converted." };
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      full_name: lead.full_name,
      relation: "other",
      id_type: "cnic",
      phone: lead.phone ?? "",
      source: lead.source,
      stage: "negotiation",
      notes: lead.notes ?? null,
      assigned_to: profile.id,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    return { error: customerError?.message ?? "Could not create customer." };
  }

  await supabase
    .from("leads")
    .update({
      status: "won",
      converted_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  await logAudit({
    action: "status_change",
    entityType: "lead",
    entityId: lead.id,
    summary: `Lead "${lead.full_name}" converted to customer`,
    actorId: profile.id,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/customers");
  return { error: null, customerId: customer.id };
}

export async function addLeadNote(input: {
  lead_id: string;
  activity_type: string;
  body: string;
}) {
  const { profile } = await requireProfile();

  if (!canManageLeads(profile.role)) {
    return { error: "You do not have permission to update leads." };
  }

  if (!input.body?.trim()) {
    return { error: "Write something before logging it." };
  }

  await logActivity({
    entityType: "lead",
    entityId: input.lead_id,
    activityType: input.activity_type || "note",
    subject: null,
    body: input.body.trim(),
    actorId: profile.id,
  });

  revalidatePath(`/leads/${input.lead_id}`);
  return { error: null };
}

export async function deleteLead(id: string): Promise<void | { error?: string | null }> {
  const { profile } = await requireProfile();
  if (!canManageLeads(profile.role)) {
    return { error: "You do not have permission to delete leads." };
  }
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/leads");
  return { error: null };
}