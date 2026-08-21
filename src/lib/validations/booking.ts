import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

export const bookingSchema = z
  .object({
    customer_id: z.string().uuid("Select a customer"),
    property_id: z.string().uuid("Select a property"),
    lock_type: z.enum(["hold", "booked"]),
    rate_per_unit: z.coerce.number().positive("Rate is required"),
    token_amount: z.coerce.number().nonnegative().default(0),
    payment_type: z.enum(["cash", "emi", "conditional"]),
    term_months: z.coerce.number().int().min(0).default(0),
    balloon_mode: z.enum(["none", "every_3_months", "every_6_months", "every_12_months", "custom"]).default("none"),
    balloon_interval: z.coerce.number().int().min(0).default(0),
    balloon_amount: z.coerce.number().nonnegative().default(0),
    custom_balloon_months: optionalText,
    possession_amount: z.coerce.number().nonnegative().default(0),
    agreement_date: optionalText,
    agreement_terms: optionalText,
    notes: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.payment_type === "emi" && value.term_months < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose 3, 6, 12 or a custom term of at least 2 months",
        path: ["term_months"],
      });
    }
  });

export type BookingFormValues = z.input<typeof bookingSchema>;
