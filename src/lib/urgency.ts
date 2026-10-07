import { differenceInDays, isSameDay, isToday, isTomorrow, startOfDay } from "date-fns";

export type UrgencyGroup = "overdue" | "today" | "tomorrow" | "this-week" | "later" | "done";

export interface GroupedItem<T> {
  group: UrgencyGroup;
  label: string;
  items: T[];
}

export function getUrgencyGroup(dueDate: Date, status: string): UrgencyGroup {
  if (status === "completed") return "done";
  if (status === "skipped") return "done";

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const diff = differenceInDays(due, today);

  if (diff < 0 || status === "overdue") return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "this-week";
  return "later";
}

export const GROUP_CONFIG: Record<UrgencyGroup, { label: string; chipClass: string; dotColor: string }> = {
  overdue: { label: "已逾期", chipClass: "bg-red-50 text-red-500 border border-red-100", dotColor: "bg-red-500" },
  today: { label: "今天", chipClass: "bg-orange-50 text-orange-500 border border-orange-100", dotColor: "bg-orange-500" },
  tomorrow: { label: "明天", chipClass: "bg-blue-50 text-blue-500 border border-blue-100", dotColor: "bg-blue-500" },
  "this-week": { label: "本周", chipClass: "bg-purple-50 text-purple-500 border border-purple-100", dotColor: "bg-purple-500" },
  later: { label: "之后", chipClass: "bg-muted text-muted-foreground", dotColor: "bg-muted-foreground" },
  done: { label: "已完成", chipClass: "bg-green-50 text-green-600 border border-green-100", dotColor: "bg-green-500" },
};

export const GROUP_ORDER: UrgencyGroup[] = ["overdue", "today", "tomorrow", "this-week", "later", "done"];

export function groupByUrgency<T extends { dueDate: Date | string; status: string }>(
  items: T[]
): GroupedItem<T>[] {
  const map = new Map<UrgencyGroup, T[]>();
  GROUP_ORDER.forEach((g) => map.set(g, []));

  for (const item of items) {
    const group = getUrgencyGroup(new Date(item.dueDate), item.status);
    map.get(group)!.push(item);
  }

  return GROUP_ORDER.filter((g) => (map.get(g)?.length ?? 0) > 0).map((g) => ({
    group: g,
    label: GROUP_CONFIG[g].label,
    items: map.get(g)!,
  }));
}
