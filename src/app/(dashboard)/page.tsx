import Link from "next/link";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const FEED_COLORS: Record<string, string> = {
  cleaning_done: "#22c55e",
  item_purchased: "#3b82f6",
  bill_recorded: "#f97316",
  repair_submitted: "#ef4444",
  repair_completed: "#8b5cf6",
  default: "#94a3b8",
};

const FEED_LABELS: Record<string, (data: Record<string, string>) => string> = {
  cleaning_done: (d) => `完成了 ${d.zoneName ?? "清洁任务"} ✓`,
  item_purchased: (d) => `登记采购 ${d.name ?? "物品"} ¥${d.price ?? ""}`,
  bill_recorded: (d) => `录入 ${d.title ?? "账单"}`,
  repair_submitted: (d) => `提交报修：${d.title ?? "维修工单"}`,
  repair_completed: (d) => `完成维修：${d.title ?? "工单"}`,
};

function parseFeedText(actionType: string, actionData: string | null, actorName: string): { text: string; color: string } {
  let data: Record<string, string> = {};
  try { data = JSON.parse(actionData ?? "{}"); } catch { /* noop */ }
  const labelFn = FEED_LABELS[actionType];
  const text = labelFn ? `${actorName} ${labelFn(data)}` : `${actorName} 执行了操作`;
  return { text, color: FEED_COLORS[actionType] ?? FEED_COLORS.default };
}

export default async function DashboardPage() {
  const house = await prisma.house.findFirst({ where: { name: "朝阳合租" } });

  if (!house) {
    return (
      <div className="p-4 text-muted-foreground">未找到房屋数据，请先运行 seed。</div>
    );
  }

  const currentPeriod = new Date().toISOString().slice(0, 7);

  const [members, bills, overdueAssignments, pendingRepairs, lowStockItems, feeds] =
    await Promise.all([
      prisma.member.findMany({
        where: { houseId: house.id, leaveDate: null },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.utilityBill.findMany({
        where: { houseId: house.id, period: currentPeriod },
        include: { splits: true },
      }),
      prisma.cleaningAssignment.findMany({
        where: {
          zone: { houseId: house.id },
          status: { in: ["pending", "overdue"] },
          dueDate: { lt: new Date() },
        },
        include: {
          zone: true,
          member: { include: { user: { select: { name: true } } } },
        },
        take: 5,
        orderBy: { dueDate: "asc" },
      }),
      prisma.repairOrder.findMany({
        where: { houseId: house.id, status: { in: ["submitted", "claimed"] } },
        orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
        take: 3,
      }),
      prisma.sharedItem.findMany({
        where: { houseId: house.id, lowStock: true },
        take: 3,
      }),
      prisma.activityFeed.findMany({
        where: { houseId: house.id },
        include: { actorMember: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const totalBill = bills.reduce((s, b) => s + b.totalAmount, 0);
  const memberCount = members.length || 1;
  const myShare = totalBill / memberCount;

  // Aggregate todos
  const todos: { id: string; icon: string; title: string; sub: string; urgency: string; href: string }[] = [
    ...overdueAssignments.map((a) => ({
      id: a.id,
      icon: "✨",
      title: a.zone.name,
      sub: `逾期 · ${a.member.user.name}`,
      urgency: "overdue",
      href: "/cleaning",
    })),
    ...pendingRepairs.map((r) => ({
      id: r.id,
      icon: "🔧",
      title: r.title,
      sub: r.status === "submitted" ? "待认领" : "已认领",
      urgency: r.urgency === "urgent" ? "urgent" : "normal",
      href: "/repairs",
    })),
    ...lowStockItems.map((i) => ({
      id: i.id,
      icon: "📦",
      title: i.name,
      sub: "低库存提醒",
      urgency: "low",
      href: "/items",
    })),
  ].slice(0, 6);

  const urgencyConfig = {
    overdue: { label: "已逾期", variant: "destructive" as const },
    urgent: { label: "紧急", variant: "destructive" as const },
    normal: { label: "待处理", variant: "outline" as const },
    low: { label: "补货", variant: "secondary" as const },
  };

  const overdueCount = todos.filter((t) => t.urgency === "overdue" || t.urgency === "urgent").length;

  const quickActions = [
    { icon: "🛒", label: "登记采购", href: "/items" },
    { icon: "💡", label: "录入水电", href: "/expenses" },
    { icon: "🔧", label: "报修", href: "/repairs" },
    { icon: "📢", label: "发公告", href: "/board" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">首页</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {house.name} · {currentPeriod.replace("-", "年")}月
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左列 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 账单卡 */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-green-700 p-5 text-white">
            <p className="text-sm opacity-80">{currentPeriod.replace("-", "年")}月 · 账单</p>
            <p className="text-4xl font-extrabold mt-1">
              ¥{totalBill > 0 ? totalBill.toFixed(2) : "—"}
            </p>
            <p className="text-sm opacity-85 mt-1">
              {totalBill > 0 ? `每人应付约 ¥${myShare.toFixed(2)}` : "本月暂无账单"}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "已录入", val: bills.length + " 项" },
                { label: "分摊人数", val: memberCount + " 人" },
                { label: "我应付", val: totalBill > 0 ? `¥${myShare.toFixed(0)}` : "—" },
              ].map((s) => (
                <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold">{s.val}</p>
                  <p className="text-xs opacity-75 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/expenses"
              className="mt-4 text-sm bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg font-medium flex items-center gap-1 w-fit"
            >
              查看账单明细 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 待办 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                待处理事项
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {overdueCount} 项紧急
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {todos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  🎉 暂无待处理事项
                </div>
              ) : todos.map((item, i) => {
                const cfg = urgencyConfig[item.urgency as keyof typeof urgencyConfig] ??
                  urgencyConfig.normal;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${i < todos.length - 1 ? "border-b" : ""}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0 text-xs">
                      {cfg.label}
                    </Badge>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* 右列 */}
        <div className="space-y-4">
          {/* 快捷入口 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">快捷入口</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 pt-0">
              {quickActions.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-xs font-medium"
                >
                  <span className="text-xl">{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* 动态 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                最近动态
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {feeds.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">暂无动态</div>
              ) : feeds.map((f, i) => {
                const actorName = f.actorMember?.user.name ?? "系统";
                const { text, color } = parseFeedText(f.actionType, f.actionData, actorName);
                return (
                  <div key={f.id} className={`flex gap-3 px-4 py-3 ${i < feeds.length - 1 ? "border-b" : ""}`}>
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">{text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(f.createdAt, { addSuffix: true, locale: zhCN })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 成员 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">本月成员</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {m.user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.user.name}</p>
                    <p className="text-xs text-muted-foreground">{m.roomNumber ?? "未分配房间"}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
