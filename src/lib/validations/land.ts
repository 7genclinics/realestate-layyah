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

export const landParcelSchema = z
  .object({
    society_id: z.string().uuid("Select a society"),
    party_id: optionalUuid,
    acquisition_type: z.enum(["purchase", "exchange_in", "society_owned"]),
    title: z.string().min(2, "Land description is required"),
    location: optionalText,
    description: optionalText,
    khasra: optionalText,
    khewat: optionalText,
    khata: optionalText,
    mouza: optionalText,
    area: z.coerce.number().positive("Area must be greater than 0"),
    area_unit: z.enum(["marla", "kanal", "acre", "sq_ft", "sq_yd"]),
    rate_per_unit: z.coerce.number().min(0, "Rate cannot be negative"),
    purchase_value: z.coerce.number().min(0, "Purchase value cannot be negative"),
    token_amount: z.coerce.number().min(0).optional(),
    status: z.enum(["proposed", "under_negotiation"]),
    agreement_terms: optionalText,
    notes: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.acquisition_type === "purchase" && !value.party_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the landlord / seller",
        path: ["party_id"],
      });
    }
  });

export const landPaymentSchema = z.object({
  land_parcel_id: z.string().uuid("Select a land record"),
  cash_account_id: z.string().uuid("Select an account"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_mode: z.enum(["cash", "bank_transfer", "cheque", "other"]),
  reference_no: optionalText,
  notes: optionalText,
  // Storage path of an uploaded bank-transfer / cheque slip, if any.
  slip_path: optionalText,
});

export const landExchangeSchema = z
  .object({
    society_id: z.string().uuid("Select a society"),
    party_id: z.string().uuid("Select the other party"),
    outgoing_property_id: optionalUuid,
    outgoing_land_id: optionalUuid,
    incoming_title: z.string().min(2, "Incoming land description is required"),
    incoming_location: optionalText,
    incoming_description: optionalText,
    incoming_area: z.coerce.number().positive("Incoming area is required"),
    incoming_area_unit: z.enum(["marla", "kanal", "acre", "sq_ft", "sq_yd"]),
    incoming_khasra: optionalText,
    incoming_khewat: optionalText,
    incoming_khata: optionalText,
    incoming_mouza: optionalText,
    outgoing_value: z.coerce.number().min(0, "Outgoing value cannot be negative"),
    incoming_value: z.coerce.number().min(0, "Incoming value cannot be negative"),
    token_amount: z.coerce.number().min(0).optional(),
    agreement_terms: optionalText,
    notes: optionalText,
  })
  .superRefine((value, ctx) => {
    if (!value.outgoing_property_id && !value.outgoing_land_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the property or land parcel being given",
        path: ["outgoing_property_id"],
      });
    }
  });

export type LandParcelFormValues = z.input<typeof landParcelSchema>;
export type LandPaymentFormValues = z.input<typeof landPaymentSchema>;
export type LandExchangeFormValues = z.input<typeof landExchangeSchema>;
