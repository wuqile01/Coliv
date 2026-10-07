import { z } from "zod";

export const sharedItemSchema = z.object({
  type: z.enum(["consumable", "durable"]),
  name: z.string().trim().min(1, "物品名称不能为空").max(30),
  price: z.coerce.number().positive("价格必须大于 0"),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式 YYYY-MM-DD"),
  photoUrl: z.string().url().optional().or(z.literal("")),
  ownership: z.enum(["shared", "personal"]).optional().default("shared"),
  splitMethod: z.enum(["equal", "by_room", "purchaser_only", "custom"]).optional().default("equal"),
});

export type SharedItemInput = z.infer<typeof sharedItemSchema>;
