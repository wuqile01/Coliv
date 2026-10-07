"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupedTaskList, TaskCard } from "@/components/cleaning/GroupedTaskList";
import { GROUP_CONFIG } from "@/lib/urgency";
import type { GroupedItem, UrgencyGroup } from "@/lib/urgency";

interface Assignment {
  id: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
  zoneId: string;
  zoneName: string;
  zoneIcon: string;
  frequency: string;
  freqLabel: string;
  tasks: string[];
  memberId: string;
  memberName: string;
}

interface CleaningClientPageProps {
  assignments: Assignment[];
  groupedAll: GroupedItem<Assignment>[];
  members: { id: string; name: string }[];
  houseId: string;
}

const DEMO_MEMBER_NAME = "张三";

export function CleaningClientPage({ assignments, groupedAll, members, houseId }: CleaningClientPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 「我的任务」—— 演示用第一个成员
  const myMemberId = members[0]?.id;
  const myAssignments = assignments.filter((a) => a.memberId === myMemberId);
  const myGrouped = groupedAll
    .map((g) => ({ ...g, items: g.items.filter((a) => a.memberId === myMemberId) }))
    .filter((g) => g.items.length > 0);

  async function handleComplete(assignmentId: string) {
    await fetch(`/api/cleaning/assignments/${assignmentId}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: [] }) });
    startTransition(() => router.refresh());
  }

  async function handleSkip(assignmentId: string) {
    await fetch(`/api/cleaning/assignments/${assignmentId}/skip`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "" }) });
    startTransition(() => router.refresh());
  }

  async function handleAutoSchedule() {
    await fetch("/api/cleaning/assignments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ houseId }) });
    startTransition(() => router.refresh());
  }

  function renderCard(a: Assignment) {
    const group = (() => {
      const today = new Date(); today.setHours(0,0,0,0);
      const due = new Date(a.dueDate); due.setHours(0,0,0,0);
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
      if (a.status === "completed" || a.status === "skipped") return "done";
      if (diff < 0 || a.status === "overdue") return "overdue";
      if (diff === 0) return "today";
      if (diff === 1) return "tomorrow";
      return diff <= 7 ? "this-week" : "later";
    })() as UrgencyGroup;

    const cfg = GROUP_CONFIG[group];
    const chipLabel = group === "overdue" ? `逾期 ${Math.abs(Math.round((new Date(a.dueDate).getTime() - Date.now()) / 86400000))} 天`
      : group === "today" ? "今天截止"
      : group === "tomorrow" ? "明天截止"
      : group === "done" ? "已完成"
      : `${Math.round((new Date(a.dueDate).getTime() - Date.now()) / 86400000)} 天后`;

    return (
      <TaskCard
        key={a.id}
        icon={a.zoneIcon}
        title={a.zoneName}
        subtitle={a.tasks.length > 0 ? a.tasks.slice(0, 3).join(" · ") : undefined}
        tag={{ label: a.zoneName, className: "bg-muted text-muted-foreground" }}
        chipLabel={chipLabel}
        chipClass={cfg.chipClass}
        freqLabel={a.freqLabel}
        dimmed={group === "done" || group === "later"}
        onComplete={() => handleComplete(a.id)}
        onMore={() => handleSkip(a.id)}
      />
    );
  }

  const pendingCount = assignments.filter((a) => ["pending", "overdue"].includes(a.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">清洁中心</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {pendingCount} 项待处理
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoSchedule} disabled={isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />排班
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />新建区域
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mine">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="mine">
            我的任务
            {myAssignments.filter((a) => ["pending","overdue"].includes(a.status)).length > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {myAssignments.filter((a) => ["pending","overdue"].includes(a.status)).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">全部任务</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          <GroupedTaskList groups={myGrouped} renderCard={renderCard} />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <GroupedTaskList groups={groupedAll} renderCard={renderCard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
