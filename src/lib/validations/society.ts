import { z } from "zod";

export const societySchema = z.object({
  name: z.string().min(2, "Society name is required"),
  location: z.string().optional(),
  status: z.enum(["planning", "active", "completed", "closed"]),
  notes: z.string().optional(),
});

export type SocietyFormValues = z.infer<typeof societySchema>;
