import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

export const customerSchema = z.object({
  full_name: z.string().min(2, "Customer name is required"),
  relation: z.enum(["s_o", "w_o", "d_o", "c_o", "other"]),
  guardian_name: optionalText,
  caste: optionalText,
  id_type: z.enum(["cnic", "passport", "other"]),
  id_number: optionalText,
  phone: z.string().min(7, "Primary phone is required"),
  phone_secondary: optionalText,
  address: optionalText,
  source: z.enum(["walk_in", "referral", "agent", "campaign", "other"]),
  stage: z.enum([
    "lead",
    "negotiation",
    "booked",
    "agreement_pending",
    "active_emi",
    "fully_paid",
    "registry_pending",
    "closed",
    "cancelled",
  ]),
  notes: optionalText,
});

export type CustomerFormValues = z.input<typeof customerSchema>;
