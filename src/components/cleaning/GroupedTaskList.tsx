"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUP_CONFIG, type GroupedItem, type UrgencyGroup } from "@/lib/urgency";

interface TaskCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  tag?: { label: string; className: string };
  chipLabel: string;
  chipClass: string;
  freqLabel?: string;
  dimmed?: boolean;
  onComplete?: () => void;
  onMore?: () => void;
}

export function TaskCard({
  icon, title, subtitle, tag, chipLabel, chipClass,
  freqLabel, dimmed, onComplete, onMore,
}: TaskCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-border p-3 flex gap-3 items-center", dimmed && "opacity-60")}>
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1.5 mb-1">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", chipClass)}>{chipLabel}</span>
          {freqLabel && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{freqLabel}</span>}
        </div>
        <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        {tag && <span className={cn("inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1", tag.className)}>{tag.label}</span>}
      </div>
      <div className="flex flex-col gap-1.5 items-center shrink-0">
        <button
          onClick={onComplete}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30 hover:bg-primary/90 transition-colors"
          aria-label="标记完成"
        >
          <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
        </button>
        <button onClick={onMore} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="更多">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface GroupHeaderProps {
  label: string;
  count: number;
  group: UrgencyGroup;
  collapsed: boolean;
  onToggle: () => void;
}

export function GroupHeader({ label, count, group, collapsed, onToggle }: GroupHeaderProps) {
  const cfg = GROUP_CONFIG[group];
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full py-2 select-none"
    >
      <div className="flex-1 h-px bg-border" />
      <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", cfg.chipClass)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dotColor)} />
        {count} {label}
        {collapsed ? <ChevronRight className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
      </div>
      <div className="flex-1 h-px bg-border" />
    </button>
  );
}

interface GroupedTaskListProps<T extends { id: string; dueDate: Date | string; status: string }> {
  groups: GroupedItem<T>[];
  renderCard: (item: T) => React.ReactNode;
}

export function GroupedTaskList<T extends { id: string; dueDate: Date | string; status: string }>({
  groups,
  renderCard,
}: GroupedTaskListProps<T>) {
  const [collapsed, setCollapsed] = useState<Set<UrgencyGroup>>(new Set(["done"]));

  function toggle(group: UrgencyGroup) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(group)) { next.delete(group); } else { next.add(group); }
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-4xl mb-3">✨</p>
        <p className="text-sm font-medium">没有待处理的任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map(({ group, label, items }) => (
        <div key={group}>
          <GroupHeader
            group={group}
            label={label}
            count={items.length}
            collapsed={collapsed.has(group)}
            onToggle={() => toggle(group)}
          />
          {!collapsed.has(group) && (
            <div className="space-y-2 px-0.5">
              {items.map((item) => renderCard(item))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
