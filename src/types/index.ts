// 分摊方式
export type SplitMethod = "equal" | "by_room" | "by_days" | "purchaser_only" | "custom";

// 清洁任务状态
export type CleaningStatus = "pending" | "completed" | "overdue" | "skipped";

// 清洁频率
export type CleaningFrequency = "daily" | "weekly" | "biweekly" | "monthly";

// 费用类型
export type UtilityType = "electric" | "water" | "gas" | "internet" | "property" | "other";

// 维修工单状态
export type RepairStatus = "submitted" | "claimed" | "in_progress" | "completed" | "settled";

// 结算状态
export type SettlementStatus = "pending" | "paid" | "confirmed";

// 成员角色
export type MemberRole = "owner" | "admin" | "member";

// 紧急程度
export type Urgency = "urgent" | "normal";

// 分摊明细（月度账单用）
export interface MemberBillSummary {
  memberId: string;
  name: string;
  items: Array<{
    category: string;
    amount: number;
    itemName?: string;
  }>;
  total: number;
}

// 最优结算路径
export interface SettlementRoute {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}
