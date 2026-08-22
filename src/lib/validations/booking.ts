import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

const PROPERTY_TYPES = [
  "residential_plot",
  "commercial_plot",
  "agricultural_land",
  "shop",
  "house",
  "office",
  "other",
] as const;

const AREA_UNITS = ["marla", "kanal", "acre", "sq_ft", "sq_yd"] as const;

export const bookingSchema = z
  .object({
    // "society" = a unit picked from society inventory (default).
    // "external" = an off-society / open-market plot, shop or other unit that
    // is not tracked in inventory but still needs a full payment plan.
    deal_type: z.enum(["society", "external"]).default("society"),
    customer_id: z.string().uuid("Select a customer"),
    property_id: z.string().optional(),
    // External-only unit details (ignored for society deals):
    ext_property_type: z.enum(PROPERTY_TYPES).default("residential_plot"),
    ext_plot_no: optionalText,
    ext_area: z.coerce.number().nonnegative().optional(),
    ext_area_unit: z.enum(AREA_UNITS).default("marla"),
    ext_location: optionalText,
    ext_seller_name: optionalText,
    ext_registry_no: optionalText,
    ext_khata_no: optionalText,
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

    if (value.deal_type === "society") {
      if (!value.property_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a property",
          path: ["property_id"],
        });
      }
      return;
    }

    // External deal — the unit details are entered by hand.
    if (!value.ext_plot_no) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the plot / unit number",
        path: ["ext_plot_no"],
      });
    }
    if (!value.ext_area || value.ext_area <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the unit area",
        path: ["ext_area"],
      });
    }
  });

export type BookingFormValues = z.input<typeof bookingSchema>;
