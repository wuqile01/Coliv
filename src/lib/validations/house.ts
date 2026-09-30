import { z } from "zod";

export const createHouseSchema = z.object({
  name: z.string().trim().min(2, "房屋名称至少 2 个字").max(30, "房屋名称最多 30 个字"),
  address: z.string().trim().max(100, "地址最多 100 个字").optional().default(""),
  roomCount: z.coerce.number().int().min(1, "至少 1 个房间").max(20, "最多 20 个房间"),
  billDay: z.coerce.number().int().min(1, "账单日最早为 1 日").max(28, "账单日最晚为 28 日"),
  cleaningCycle: z.enum(["weekly", "biweekly", "monthly"]),
  defaultSplitMethod: z.enum(["equal", "by_room", "by_head", "custom"]),
});

export type CreateHouseInput = z.infer<typeof createHouseSchema>;
