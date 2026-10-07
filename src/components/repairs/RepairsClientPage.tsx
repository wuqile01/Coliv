"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { GROUP_CONFIG } from "@/lib/urgency";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Order {
  id: string;
  title: string;
  description: string | null;
  urgency: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  cost: number | null;
  reportedByName: string;
  reportedById: string;
  claimedByName: string | null;
  claimedById: string | null;
}

interface RepairsClientPageProps {
  orders: Order[];
  members: { id: string; name: string }[];
  houseId: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  submitted: { label: "待认领", variant: "destructive" },
  claimed: { label: "已认领", variant: "default" },
  in_progress: { label: "处理中", variant: "default" },
  completed: { label: "已完成", variant: "outline" },
  settled: { label: "已结算", variant: "secondary" },
};

export function RepairsClientPage({ orders, members, houseId }: RepairsClientPageProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const pending = orders.filter((o) => ["submitted", "claimed", "in_progress"].includes(o.status));
  const done = orders.filter((o) => ["completed", "settled"].includes(o.status));
  const urgentCount = pending.filter((o) => o.urgency === "urgent").length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, houseId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "提交失败"); return; }
      setOpen(false);
      startTransition(() => router.refresh());
    } catch { setError("网络异常，请稍后重试"); }
    finally { setSubmitting(false); }
  }

  async function handleClaim(orderId: string) {
    await fetch(`/api/repairs/${orderId}/claim`, { method: "POST" });
    startTransition(() => router.refresh());
  }

  async function handleComplete(orderId: string) {
    await fetch(`/api/repairs/${orderId}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: [] }) });
    startTransition(() => router.refresh());
  }

  function renderOrder(o: Order) {
    const statusCfg = STATUS_CONFIG[o.status] ?? { label: o.status, variant: "outline" as const };
    return (
      <div key={o.id} className="flex gap-3 p-4 border-b last:border-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${o.urgency === "urgent" ? "bg-red-50" : "bg-muted"}`}>
          {o.urgency === "urgent" ? "🚨" : "🔧"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold">{o.title}</p>
            {o.urgency === "urgent" && (
              <Badge variant="destructive" className="text-[10px] px-1.5">紧急</Badge>
            )}
            <Badge variant={statusCfg.variant} className="text-[10px] px-1.5">{statusCfg.label}</Badge>
          </div>
          {o.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{o.description}</p>}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-muted-foreground">
              {o.reportedByName} · {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true, locale: zhCN })}
            </span>
            {o.claimedByName && (
              <span className="text-xs text-primary">认领人：{o.claimedByName}</span>
            )}
          </div>
          {o.status === "submitted" && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleClaim(o.id)}>
                认领
              </Button>
            </div>
          )}
          {o.status === "claimed" && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="h-7 text-xs" onClick={() => handleComplete(o.id)}>
                标记完成
              </Button>
            </div>
          )}
        </div>
        {o.cost != null && (
          <div className="text-right shrink-0">
            <p className="text-sm font-bold">¥{o.cost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">费用</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">维修中心</h2>
          {urgentCount > 0 && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />{urgentCount} 项紧急
            </p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />报修</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>提交报修工单</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="title">问题描述 *</Label>
                <Input id="title" name="title" placeholder="简短描述问题" required maxLength={50} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">详细说明</Label>
                <Textarea id="description" name="description" placeholder="提供更多细节（可选）" maxLength={500} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="urgency">紧急程度</Label>
                <Select name="urgency" defaultValue="normal">
                  <SelectTrigger id="urgency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">普通</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}提交
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="pending">
            待处理
            {pending.length > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="done">已完成 ({done.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="没有待处理的工单"
              description="家里一切正常，有问题随时报修"
              action={{ label: "提交报修", onClick: () => setOpen(true) }}
            />
          ) : (
            <Card><CardContent className="p-0">{pending.map(renderOrder)}</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4">
          {done.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="还没有已完成的工单" description="维修完成后会归档到这里" />
          ) : (
            <Card><CardContent className="p-0">{done.map(renderOrder)}</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
