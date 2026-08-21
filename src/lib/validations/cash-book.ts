import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const cashVoucherSchema = z.object({
  transaction_type: z.enum(["income", "expense"]),
  category_id: z.string().uuid("Select a category"),
  cash_account_id: z.string().uuid("Select an account"),
  society_id: optionalUuid,
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  transaction_date: z.string().min(1, "Date is required"),
  payment_mode: z.enum(["cash", "bank_transfer", "cheque", "other"]),
  description: z.string().min(1, "Description is required"),
  reference_no: optionalText,
  counterparty_name: optionalText,
  notes: optionalText,
});

export const cashTransferSchema = z
  .object({
    from_account_id: z.string().uuid("Select source account"),
    to_account_id: z.string().uuid("Select destination account"),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    transaction_date: z.string().min(1, "Date is required"),
    description: z.string().min(1, "Description is required"),
    reference_no: optionalText,
    notes: optionalText,
  })
  .refine((values) => values.from_account_id !== values.to_account_id, {
    message: "Source and destination accounts must differ",
    path: ["to_account_id"],
  });

export type CashVoucherFormValues = z.input<typeof cashVoucherSchema>;
export type CashTransferFormValues = z.input<typeof cashTransferSchema>;
