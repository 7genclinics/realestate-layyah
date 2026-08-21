import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().nonnegative().optional());

export const propertySchema = z.object({
  society_id: z.string().uuid("Select a society"),
  block_id: z.string().uuid().optional().or(z.literal("")),
  new_block_name: optionalText,
  property_type: z.enum([
    "residential_plot",
    "commercial_plot",
    "agricultural_land",
    "shop",
    "house",
    "office",
    "other",
  ]),
  plot_no: z.string().min(1, "Plot / shop number is required"),
  length_ft: optionalNumber,
  width_ft: optionalNumber,
  area: z.coerce.number().positive("Area must be greater than 0"),
  area_unit: z.enum(["marla", "kanal", "acre", "sq_ft", "sq_yd"]),
  facing: optionalText,
  street_width_ft: optionalNumber,
  attributes: optionalText,
  ownership_source: z.enum([
    "society_owned",
    "acquired",
    "exchanged",
    "third_party_listing",
  ]),
  asking_price: optionalNumber,
  monthly_rent: optionalNumber,
  security_deposit: optionalNumber,
  acquisition_cost: optionalNumber,
  min_approved_price: optionalNumber,
  agent_visible: z.boolean().optional(),
  internal_notes: optionalText,
  agent_notes: optionalText,
});

export type PropertyFormValues = z.input<typeof propertySchema>;

export const propertyStatusSchema = z
  .object({
    property_id: z.string().uuid(),
    status: z.enum([
      "available",
      "hold",
      "booked",
      "sold",
      "rented",
      "transferred",
      "blocked",
    ]),
    reason: optionalText,
    hold_until: optionalText,
    hold_party_name: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.status === "hold" && !value.hold_party_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter who the plot is held for",
        path: ["hold_party_name"],
      });
    }
  });

export type PropertyStatusFormValues = z.input<typeof propertyStatusSchema>;
