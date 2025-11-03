import { z } from "zod";

export const ChecklistSchema = z.object({
  entry: z.coerce.number().positive(),
  stop: z.coerce.number().positive(),
  target: z.coerce.number().positive(),
  qty: z.coerce.number().int().positive(),
  acct: z.coerce.number().positive(),
  maxRiskPct: z.coerce.number().min(0.1).max(5),
});
