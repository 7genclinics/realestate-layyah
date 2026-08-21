"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import {
  ALLOWED_DOCUMENT_MIME,
  MAX_DOCUMENT_BYTES,
} from "@/lib/documents";
import {
  canApproveDocuments,
  canManageDocuments,
} from "@/lib/permissions";
import { createClient } from "@/lib/server";
import { documentMetaSchema } from "@/lib/validations/document";

function revalidateDocuments(entityType?: string, entityId?: string) {
  revalidatePath("/documents");
  if (entityType === "customer" && entityId) {
    revalidatePath(`/customers/${entityId}`);
  }
  if (entityType === "property" && entityId) {
    revalidatePath(`/inventory/${entityId}`);
  }
  if (entityType === "party" && entityId) {
    revalidatePath(`/parties/${entityId}`);
  }
  if (entityType === "land_parcel" && entityId) {
    revalidatePath(`/land-bank/${entityId}`);
  }
  if (entityType === "land_exchange" && entityId) {
    revalidatePath(`/land-bank/exchanges/${entityId}`);
  }
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

export async function uploadDocument(formData: FormData) {
  const parsed = documentMetaSchema.safeParse({
    title: formData.get("title"),
    document_type: formData.get("document_type"),
    entity_type: formData.get("entity_type"),
    entity_id: formData.get("entity_id"),
    document_date: formData.get("document_date"),
    description: formData.get("description") ?? "",
    is_confidential: formData.get("is_confidential") === "on",
    replaces_id: formData.get("replaces_id") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid document details",
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF or image file to upload." };
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "File must be 10 MB or smaller." };
  }

  if (
    !ALLOWED_DOCUMENT_MIME.includes(
      file.type as (typeof ALLOWED_DOCUMENT_MIME)[number],
    )
  ) {
    return { error: "Only JPG, PNG, WEBP and PDF files are allowed." };
  }

  const { profile } = await requireProfile();

  if (!canManageDocuments(profile.role)) {
    return { error: "You do not have permission to upload documents." };
  }

  const supabase = await createClient();
  const values = parsed.data;
  let version = 1;

  if (values.replaces_id) {
    const { data: previous } = await supabase
      .from("documents")
      .select("id, version, entity_type, entity_id")
      .eq("id", values.replaces_id)
      .maybeSingle();

    if (!previous) {
      return { error: "Document to replace was not found." };
    }

    if (
      previous.entity_type !== values.entity_type ||
      previous.entity_id !== values.entity_id
    ) {
      return { error: "Replacement must stay on the same linked record." };
    }

    version = previous.version + 1;
  }

  const documentId = crypto.randomUUID();
  const fileName = safeFileName(file.name);
  const filePath = `${values.entity_type}/${values.entity_id}/${documentId}-${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      title: values.title.trim(),
      document_type: values.document_type,
      entity_type: values.entity_type,
      entity_id: values.entity_id,
      document_date: values.document_date,
      description: values.description ?? null,
      is_confidential: values.is_confidential ?? false,
      replaces_id: values.replaces_id ?? null,
      version,
      file_path: filePath,
      file_name: fileName,
      mime_type: file.type,
      file_size: file.size,
      status: "submitted",
      uploaded_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    await supabase.storage.from("documents").remove([filePath]);
    return { error: error?.message ?? "Could not save document." };
  }

  if (values.replaces_id) {
    await supabase
      .from("documents")
      .update({ status: "replaced" })
      .eq("id", values.replaces_id);
  }

  revalidateDocuments(values.entity_type, values.entity_id);
  revalidatePath(`/documents/${data.id}`);
  return { error: null, id: data.id };
}

export async function reviewDocument(
  id: string,
  status: "approved" | "rejected",
) {
  const { profile } = await requireProfile();

  if (!canApproveDocuments(profile.role)) {
    return { error: "You do not have permission to approve documents." };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("documents")
    .select("id, status, entity_type, entity_id")
    .eq("id", id)
    .maybeSingle();

  if (!current) {
    return { error: "Document not found." };
  }

  if (current.status === "replaced") {
    return { error: "Replaced versions cannot be reviewed." };
  }

  const { error } = await supabase
    .from("documents")
    .update({
      status,
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateDocuments(current.entity_type, current.entity_id);
  revalidatePath(`/documents/${id}`);
  return { error: null };
}

export async function getDocumentSignedUrl(id: string) {
  await requireProfile();
  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  if (!document) {
    return { error: "Document not found.", url: null };
  }

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.file_path, 60);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "Could not create download link.", url: null };
  }

  return { error: null, url: data.signedUrl };
}
