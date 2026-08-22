"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { canManageInventory } from "@/lib/permissions";
import { createClient } from "@/lib/server";
import {
  propertySchema,
  propertyStatusSchema,
} from "@/lib/validations/property";

function emptyToNull(value?: number) {
  return value === undefined ? null : value;
}

export async function createProperty(input: unknown) {
  const parsed = propertySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid property details" };
  }

  const { profile } = await requireProfile();

  if (!canManageInventory(profile.role)) {
    return { error: "You do not have permission to add inventory." };
  }

  const supabase = await createClient();
  const values = parsed.data;
  let blockId = values.block_id || null;

  if (values.new_block_name) {
    const { data: block, error: blockError } = await supabase
      .from("society_blocks")
      .insert({
        society_id: values.society_id,
        name: values.new_block_name,
      })
      .select("id")
      .single();

    if (blockError || !block) {
      return { error: blockError?.message ?? "Could not create block." };
    }

    blockId = block.id;
  }

  const attributes = values.attributes
    ? values.attributes.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      society_id: values.society_id,
      block_id: blockId,
      property_type: values.property_type,
      plot_no: values.plot_no.trim(),
      length_ft: emptyToNull(values.length_ft),
      width_ft: emptyToNull(values.width_ft),
      area: values.area,
      area_unit: values.area_unit,
      facing: values.facing ?? null,
      street_width_ft: emptyToNull(values.street_width_ft),
      attributes,
      ownership_source: values.ownership_source,
      asking_price: emptyToNull(values.asking_price),
      monthly_rent: emptyToNull(values.monthly_rent),
      security_deposit: emptyToNull(values.security_deposit),
      agent_visible: Boolean(values.agent_visible),
      internal_notes: values.internal_notes ?? null,
      agent_notes: values.agent_notes ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !property) {
    return { error: error?.message ?? "Could not create property." };
  }

  if (
    values.acquisition_cost !== undefined ||
    values.min_approved_price !== undefined
  ) {
    // property_id is the PK — upsert so the cost row is created if a trigger
    // did not already seed it, and updated otherwise.
    const { error: costError } = await supabase
      .from("property_costs")
      .upsert(
        {
          property_id: property.id,
          acquisition_cost: emptyToNull(values.acquisition_cost),
          min_approved_price: emptyToNull(values.min_approved_price),
        },
        { onConflict: "property_id" },
      );

    if (costError) {
      return { error: costError.message };
    }
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { error: null, id: property.id };
}

export async function updateProperty(id: string, input: unknown) {
  const parsed = propertySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid property details" };
  }

  const { profile } = await requireProfile();

  if (!canManageInventory(profile.role)) {
    return { error: "You do not have permission to edit inventory." };
  }

  const supabase = await createClient();
  const values = parsed.data;
  let blockId = values.block_id || null;

  if (values.new_block_name) {
    const { data: block, error: blockError } = await supabase
      .from("society_blocks")
      .insert({
        society_id: values.society_id,
        name: values.new_block_name,
      })
      .select("id")
      .single();

    if (blockError || !block) {
      return { error: blockError?.message ?? "Could not create block." };
    }

    blockId = block.id;
  }

  const attributes = values.attributes
    ? values.attributes.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  const { error } = await supabase
    .from("properties")
    .update({
      society_id: values.society_id,
      block_id: blockId,
      property_type: values.property_type,
      plot_no: values.plot_no.trim(),
      length_ft: emptyToNull(values.length_ft),
      width_ft: emptyToNull(values.width_ft),
      area: values.area,
      area_unit: values.area_unit,
      facing: values.facing ?? null,
      street_width_ft: emptyToNull(values.street_width_ft),
      attributes,
      ownership_source: values.ownership_source,
      asking_price: emptyToNull(values.asking_price),
      monthly_rent: emptyToNull(values.monthly_rent),
      security_deposit: emptyToNull(values.security_deposit),
      agent_visible: Boolean(values.agent_visible),
      internal_notes: values.internal_notes ?? null,
      agent_notes: values.agent_notes ?? null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (
    values.acquisition_cost !== undefined ||
    values.min_approved_price !== undefined
  ) {
    const { error: costError } = await supabase
      .from("property_costs")
      .upsert(
        {
          property_id: id,
          acquisition_cost: emptyToNull(values.acquisition_cost),
          min_approved_price: emptyToNull(values.min_approved_price),
        },
        { onConflict: "property_id" },
      );

    if (costError) {
      return { error: costError.message };
    }
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/dashboard");
  return { error: null, id };
}

export async function changePropertyStatus(input: unknown) {
  const parsed = propertyStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status change" };
  }

  const { profile } = await requireProfile();

  if (!canManageInventory(profile.role)) {
    return { error: "You do not have permission to change inventory status." };
  }

  const supabase = await createClient();
  const values = parsed.data;

  const { error } = await supabase
    .from("properties")
    .update({
      status: values.status,
      hold_reason: values.reason ?? null,
      hold_until: values.status === "hold" ? values.hold_until ?? null : null,
      hold_party_name:
        values.status === "hold" ? values.hold_party_name ?? null : null,
    })
    .eq("id", values.property_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${values.property_id}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteProperty(id: string): Promise<void> {
  const { profile } = await requireProfile();
  if (!canManageInventory(profile.role)) return;
  const supabase = await createClient();
  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
