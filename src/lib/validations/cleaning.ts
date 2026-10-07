import { z } from "zod";

export const cleaningZoneSchema = z.object({
  name: z.string().trim().min(1, "区域名称不能为空").max(20, "最多 20 个字"),
  icon: z.string().trim().max(20).optional().default("Sparkles"),
  difficultyWeight: z.coerce.number().int().min(1).max(5).optional().default(1),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional().default("weekly"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const cleaningAssignmentSchema = z.object({
  zoneId: z.string().cuid(),
  memberId: z.string().cuid(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const completeAssignmentSchema = z.object({
  photos: z.array(z.string().url()).optional().default([]),
});

export const skipAssignmentSchema = z.object({
  reason: z.string().trim().max(100).optional().default(""),
});

export type CleaningZoneInput = z.infer<typeof cleaningZoneSchema>;
