import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

export const leadSchema = z.object({
  full_name: z.string().min(2, "Lead name is required"),
  phone: optionalText,
  source: z.enum(["walk_in", "referral", "agent", "campaign", "other"]),
  status: z.enum([
    "new",
    "contacted",
    "interested",
    "negotiation",
    "won",
    "lost",
  ]),
  society_id: z.string().uuid().optional().or(z.literal("")),
  agent_id: z.string().uuid().optional().or(z.literal("")),
  interest: optionalText,
  budget: z.coerce.number().nonnegative().optional(),
  notes: optionalText,
});

export type LeadFormValues = z.input<typeof leadSchema>;

export const leadStatusSchema = z.object({
  lead_id: z.string().uuid(),
  status: z.enum([
    "new",
    "contacted",
    "interested",
    "negotiation",
    "won",
    "lost",
  ]),
  note: optionalText,
});
