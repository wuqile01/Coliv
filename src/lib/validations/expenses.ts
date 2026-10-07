import { z } from "zod";

export const utilityBillSchema = z.object({
  type: z.enum(["electric", "water", "gas", "internet", "property", "other"]),
  period: z.string().regex(/^\d{4}-\d{2}$/, "period 格式 YYYY-MM"),
  mode: z.enum(["reading", "amount"]),
  totalAmount: z.coerce.number().positive("金额必须大于 0"),
  readingBefore: z.coerce.number().optional(),
  readingAfter: z.coerce.number().optional(),
  unitPrice: z.coerce.number().optional(),
  splitMethod: z.enum(["equal", "by_days", "custom"]).optional().default("equal"),
});

export type UtilityBillInput = z.infer<typeof utilityBillSchema>;
