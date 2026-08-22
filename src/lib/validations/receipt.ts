import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

export const receivePaymentSchema = z.object({
  sale_id: z.string().uuid("Select a sale"),
  // A specific installment UUID, "" for auto-allocate, or "custom" — a UI
  // sentinel for a partial payment that is auto-allocated (oldest EMI first,
  // remainder carries forward). "custom" is normalized to auto-allocate server-side.
  installment_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .or(z.literal("custom")),
  cash_account_id: z.string().uuid("Select the account the money landed in"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_mode: z.enum(["cash", "bank_transfer", "cheque", "other"]),
  reference_no: optionalText,
  notes: optionalText,
  // Storage path of an uploaded bank-transfer / cheque slip, if any.
  slip_path: optionalText,
});

export type ReceivePaymentFormValues = z.input<typeof receivePaymentSchema>;
