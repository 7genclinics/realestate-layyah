import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

export const receivePaymentSchema = z.object({
  sale_id: z.string().uuid("Select a sale"),
  installment_id: z.string().uuid().optional().or(z.literal("")),
  cash_account_id: z.string().uuid("Select the account the money landed in"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_mode: z.enum(["cash", "bank_transfer", "cheque", "other"]),
  reference_no: optionalText,
  notes: optionalText,
});

export type ReceivePaymentFormValues = z.input<typeof receivePaymentSchema>;
