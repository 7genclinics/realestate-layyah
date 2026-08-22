"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { FileText, Paperclip, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/lib/actions/documents";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import {
  ALLOWED_DOCUMENT_MIME,
  MAX_DOCUMENT_BYTES,
} from "@/lib/documents";
import type { DocumentType } from "@/lib/database.types";
import { Button } from "@/components/ui/button";

const selectClassName =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm";

/**
 * A file queued in a create/edit form. The actual upload only happens after the
 * parent record is saved (so we have an entity id to link the document to).
 */
export type PendingAttachment = {
  key: string;
  file: File;
  documentType: DocumentType;
  title: string;
};

function baseName(fileName: string) {
  const stripped = fileName.replace(/\.[^.]+$/, "").trim();
  return stripped.length >= 2 ? stripped : fileName;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Uploads every queued attachment against a freshly-created (or edited) record.
 * Reuses the same `uploadDocument` server action as the standalone documents
 * module, so the files land in the review workflow exactly like a manual upload.
 * Never throws — returns a tally so the caller can surface a partial-failure toast.
 */
export async function uploadPendingAttachments(
  entityType: string,
  entityId: string,
  attachments: PendingAttachment[],
): Promise<{ uploaded: number; failed: number; firstError: string | null }> {
  let uploaded = 0;
  let failed = 0;
  let firstError: string | null = null;
  const today = format(new Date(), "yyyy-MM-dd");

  for (const item of attachments) {
    const formData = new FormData();
    formData.set("title", item.title.trim() || item.file.name || "Attachment");
    formData.set("document_type", item.documentType);
    formData.set("entity_type", entityType);
    formData.set("entity_id", entityId);
    formData.set("document_date", today);
    formData.set("file", item.file);

    try {
      const result = await uploadDocument(formData);
      if (result?.error) {
        failed += 1;
        firstError ??= result.error;
      } else {
        uploaded += 1;
      }
    } catch (error) {
      failed += 1;
      firstError ??=
        error instanceof Error ? error.message : "Upload failed";
    }
  }

  return { uploaded, failed, firstError };
}

/**
 * Inline, optional document uploader for record forms. Controlled: the parent
 * owns the queued list so it can call {@link uploadPendingAttachments} after the
 * record is saved. Files are validated (type + size) as they are picked.
 */
export function FormAttachments({
  value,
  onChange,
  defaultType = "other",
  disabled = false,
  description,
}: {
  value: PendingAttachment[];
  onChange: (next: PendingAttachment[]) => void;
  defaultType?: DocumentType;
  disabled?: boolean;
  description?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFilesPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const accepted: PendingAttachment[] = [];

    for (const file of files) {
      if (
        !ALLOWED_DOCUMENT_MIME.includes(
          file.type as (typeof ALLOWED_DOCUMENT_MIME)[number],
        )
      ) {
        toast.error(`${file.name}: only JPG, PNG, WEBP and PDF are allowed.`);
        continue;
      }
      if (file.size === 0) {
        toast.error(`${file.name}: file is empty.`);
        continue;
      }
      if (file.size > MAX_DOCUMENT_BYTES) {
        toast.error(`${file.name}: must be 10 MB or smaller.`);
        continue;
      }
      accepted.push({
        key: crypto.randomUUID(),
        file,
        documentType: defaultType,
        title: baseName(file.name),
      });
    }

    if (accepted.length) {
      onChange([...value, ...accepted]);
    }
    // Reset so picking the same file again re-fires onChange.
    event.target.value = "";
  }

  function updateType(key: string, documentType: DocumentType) {
    onChange(
      value.map((item) => (item.key === key ? { ...item, documentType } : item)),
    );
  }

  function remove(key: string) {
    onChange(value.filter((item) => item.key !== key));
  }

  return (
    <section className="space-y-3 rounded-xl border border-dashed p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Paperclip className="size-4 text-muted-foreground" />
            Attachments
            <span className="font-normal text-muted-foreground">(optional)</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {description ??
              "Attach CNIC, agreements or other files (JPG, PNG, PDF · max 10 MB)."}{" "}
            Uploaded when you save.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Plus className="size-4" />
          Add files
        </Button>
      </div>

      {value.length ? (
        <ul className="space-y-2">
          {value.map((item) => (
            <li
              key={item.key}
              className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span
                className="min-w-0 flex-1 truncate text-sm"
                title={item.file.name}
              >
                {item.file.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatBytes(item.file.size)}
              </span>
              <label className="sr-only" htmlFor={`doc-type-${item.key}`}>
                Document type for {item.file.name}
              </label>
              <select
                id={`doc-type-${item.key}`}
                className={selectClassName}
                value={item.documentType}
                disabled={disabled}
                onChange={(event) =>
                  updateType(item.key, event.target.value as DocumentType)
                }
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(item.key)}
                disabled={disabled}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label={`Remove ${item.file.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFilesPicked}
        disabled={disabled}
      />
    </section>
  );
}
