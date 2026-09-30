import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 模拟数据（Phase 2 接入真实数据后替换）
const billSummary = {
  period: "2026年9月",
  total: 856.5,
  myShare: 285.5,
  paid: 200,
  pending: 85.5,
};

const todos = [
  { id: 1, type: "cleaning", icon: "🍳", title: "厨房清洁", sub: "轮到你了", urgency: "today" },
  { id: 2, type: "cleaning", icon: "🗑️", title: "倒垃圾", sub: "已逾期 1 天", urgency: "overdue" },
  { id: 3, type: "repair", icon: "🔧", title: "卫生间水龙头漏水", sub: "维修工单 · 待认领", urgency: "urgent" },
  { id: 4, type: "item", icon: "📦", title: "纸巾快用完了", sub: "低库存提醒", urgency: "low" },
];

const feeds = [
  { id: 1, color: "#22c55e", text: "李四 完成了 卫生间清洁 ✓", time: "2小时前" },
  { id: 2, color: "#3b82f6", text: "王五 登记采购 纸巾 ¥45 · 每人¥15", time: "5小时前" },
  { id: 3, color: "#f97316", text: "张三 录入 9月电费 ¥320", time: "昨天" },
];

const quickActions = [
  { icon: "🛒", label: "登记采购", href: "/items/new" },
  { icon: "💡", label: "录入水电", href: "/expenses/new" },
  { icon: "🔧", label: "报修", href: "/repairs/new" },
  { icon: "📢", label: "发公告", href: "/board/new" },
];

const urgencyConfig = {
  overdue: { label: "已逾期", variant: "destructive" as const },
  urgent: { label: "紧急", variant: "destructive" as const },
  today: { label: "今天到期", variant: "outline" as const },
  low: { label: "补货", variant: "secondary" as const },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">首页</h2>
        <p className="text-muted-foreground text-sm mt-1">朝阳合租 · 2026年9月</p>
      </div>

      {/* 主网格：桌面 2 列，移动 1 列 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 左列（2/3 宽度） */}
        <div className="lg:col-span-2 space-y-4">

          {/* 本月账单卡片 */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-green-700 p-5 text-white">
            <p className="text-sm opacity-80">{billSummary.period} · 账单</p>
            <p className="text-4xl font-extrabold mt-1">¥{billSummary.total.toFixed(2)}</p>
            <p className="text-sm opacity-85 mt-1">每人应付约 ¥{billSummary.myShare}</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "我应付", val: `¥${billSummary.myShare}` },
                { label: "已付", val: `¥${billSummary.paid}` },
                { label: "待结清", val: `¥${billSummary.pending}`, highlight: true },
              ].map((s) => (
                <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold ${s.highlight ? "text-yellow-300" : ""}`}>{s.val}</p>
                  <p className="text-xs opacity-75 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 text-sm bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg font-medium flex items-center gap-1">
              查看账单明细 <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 本周待办 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                本周待办
                <Badge variant="destructive" className="ml-auto text-xs">2 项逾期</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {todos.map((item, i) => {
                const cfg = urgencyConfig[item.urgency as keyof typeof urgencyConfig];
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < todos.length - 1 ? "border-b" : ""}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0 text-xs">{cfg.label}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* 右列（1/3 宽度） */}
        <div className="space-y-4">

          {/* 快捷入口 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">快捷入口</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 pt-0">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-xs font-medium"
                >
                  <span className="text-xl">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* 最近动态 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                最近动态
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {feeds.map((f, i) => (
                <div key={f.id} className={`flex gap-3 px-4 py-3 ${i < feeds.length - 1 ? "border-b" : ""}`}>
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: f.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{f.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 成员概览 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">本月成员</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {[
                { name: "张三", room: "主卧", paid: true, amount: 285.5 },
                { name: "李四", room: "次卧1", paid: true, amount: 285.5 },
                { name: "王五", room: "次卧2", paid: false, amount: 285.5 },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.room}</p>
                  </div>
                  <Badge variant={m.paid ? "outline" : "destructive"} className="text-xs shrink-0">
                    {m.paid ? "已付" : "未付"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
