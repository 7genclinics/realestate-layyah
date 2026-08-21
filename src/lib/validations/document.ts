import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

export const documentMetaSchema = z.object({
  title: z.string().min(2, "Title is required"),
  document_type: z.enum([
    "agreement",
    "e_stamp",
    "registry",
    "identity",
    "payment_proof",
    "invoice",
    "receipt",
    "quotation",
    "work_order",
    "title",
    "agent_agreement",
    "other",
  ]),
  entity_type: z.enum([
    "customer",
    "sale",
    "property",
    "party",
    "contract",
    "receipt",
    "cash_transaction",
    "society",
    "land_parcel",
    "land_exchange",
  ]),
  entity_id: z.string().uuid("Select a linked record"),
  document_date: z.string().min(1, "Date is required"),
  description: optionalText,
  is_confidential: z.boolean().optional(),
  replaces_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export type DocumentMetaValues = z.input<typeof documentMetaSchema>;
