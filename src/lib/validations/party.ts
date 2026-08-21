import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

export const partySchema = z.object({
  name: z.string().min(2, "Party name is required"),
  party_type: z.enum([
    "landlord",
    "contractor",
    "subcontractor",
    "supplier",
    "utility",
    "other",
  ]),
  phone: z.string().min(7, "Primary phone is required"),
  phone_secondary: optionalText,
  address: optionalText,
  id_number: optionalText,
  opening_balance: z.coerce.number().min(0).optional(),
  status: z.enum(["active", "inactive", "blacklisted", "completed"]),
  notes: optionalText,
  bank_name: optionalText,
  account_title: optionalText,
  account_no: optionalText,
  iban: optionalText,
});

export const contractSchema = z.object({
  party_id: z.string().uuid("Select a party"),
  society_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  contract_type: z.enum([
    "earth_filling",
    "road",
    "sewerage_labour",
    "sewerage_material",
    "building_labour",
    "building_material",
    "interior",
    "wapda",
    "other",
  ]),
  title: z.string().min(2, "Work order title is required"),
  start_date: optionalText,
  end_date: optionalText,
  unit: z.enum([
    "foot",
    "sq_ft",
    "trailer",
    "dumper",
    "daily",
    "pipe",
    "lump_sum",
    "other",
  ]),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  contract_value: z.coerce.number().min(0, "Contract value is required"),
  retention_amount: z.coerce.number().min(0).optional(),
  notes: optionalText,
});

export const partyPaymentSchema = z.object({
  contract_id: z.string().uuid("Select a work order"),
  cash_account_id: z.string().uuid("Select an account"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_mode: z.enum(["cash", "bank_transfer", "cheque", "other"]),
  reference_no: optionalText,
  notes: optionalText,
});

export type PartyFormValues = z.input<typeof partySchema>;
export type ContractFormValues = z.input<typeof contractSchema>;
export type PartyPaymentFormValues = z.input<typeof partyPaymentSchema>;
