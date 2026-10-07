import { prisma } from "@/lib/prisma";
import { groupByUrgency, GROUP_CONFIG } from "@/lib/urgency";
import { CleaningClientPage } from "@/components/cleaning/CleaningClientPage";

const FREQ_LABELS: Record<string, string> = {
  daily: "每天",
  weekly: "每周",
  biweekly: "每两周",
  monthly: "每月",
};

const ZONE_ICONS: Record<string, string> = {
  厨房: "🍳",
  卫生间: "🚿",
  客厅: "🛋️",
  垃圾: "🗑️",
  阳台: "🌿",
  餐厅: "🍽️",
};

function getIcon(name: string, icon: string | null) {
  if (icon && icon.length <= 2) return icon;
  for (const [k, v] of Object.entries(ZONE_ICONS)) {
    if (name.includes(k)) return v;
  }
  return "✨";
}

export default async function CleaningPage() {
  const house = await prisma.house.findFirst({ where: { name: "朝阳合租" } });
  if (!house) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">清洁中心</h2>
        <p className="text-muted-foreground text-sm">未找到房屋数据，请先创建房屋并运行 seed。</p>
      </div>
    );
  }

  const members = await prisma.member.findMany({
    where: { houseId: house.id, leaveDate: null },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const zones = await prisma.cleaningZone.findMany({
    where: { houseId: house.id, isActive: true },
    include: { tasks: { where: { isActive: true } } },
    orderBy: { sortOrder: "asc" },
  });

  // 取最近 30 天的分配任务
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const until = new Date();
  until.setDate(until.getDate() + 30);

  const assignments = await prisma.cleaningAssignment.findMany({
    where: {
      zone: { houseId: house.id },
      dueDate: { gte: since, lte: until },
    },
    include: {
      zone: true,
      member: { include: { user: { select: { name: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  // 序列化（Date → string）传给客户端
  const serialized = assignments.map((a) => ({
    id: a.id,
    status: a.status,
    dueDate: a.dueDate.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
    zoneId: a.zoneId,
    zoneName: a.zone.name,
    zoneIcon: getIcon(a.zone.name, a.zone.icon),
    frequency: a.zone.frequency,
    freqLabel: FREQ_LABELS[a.zone.frequency] ?? "每周",
    tasks: zones.find((z) => z.id === a.zoneId)?.tasks.map((t) => t.name) ?? [],
    memberId: a.memberId,
    memberName: a.member.user.name,
  }));

  const groupedAll = groupByUrgency(serialized);

  return (
    <CleaningClientPage
      assignments={serialized}
      groupedAll={groupedAll}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      houseId={house.id}
    />
  );
}
