"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BillSplit { memberId: string; memberName: string; amount: number; }
interface Bill {
  id: string; type: string; typeLabel: string; typeIcon: string;
  period: string; totalAmount: number; splitMethod: string;
  recordedByName: string; splits: BillSplit[];
}
interface SettlementRoute {
  fromMemberId: string; fromName: string;
  toMemberId: string; toName: string; amount: number;
}

interface Props {
  bills: Bill[];
  members: { id: string; name: string }[];
  memberNet: Record<string, number>;
  settlementRoutes: SettlementRoute[];
  currentPeriod: string;
  houseId: string;
}

const BILL_TYPES = [
  { value: "electric", label: "电费", icon: "⚡" },
  { value: "water",    label: "水费", icon: "💧" },
  { value: "gas",      label: "燃气费", icon: "🔥" },
  { value: "internet", label: "宽带费", icon: "📶" },
  { value: "property", label: "物业费", icon: "🏠" },
  { value: "other",    label: "其他",   icon: "📋" },
];

export function ExpensesClientPage({ bills, members, memberNet, settlementRoutes, currentPeriod, houseId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"amount" | "reading">("amount");
  const [error, setError] = useState("");

  const totalAmount = bills.reduce((s, b) => s + b.totalAmount, 0);
  const myShare = bills.reduce((s, b) => s + (b.splits[0]?.amount ?? 0), 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = { ...Object.fromEntries(new FormData(e.currentTarget).entries()), houseId };
    try {
      const res = await fetch("/api/expenses/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "录入失败"); return; }
      setOpen(false);
      startTransition(() => router.refresh());
    } catch { setError("网络异常，请稍后重试"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">费用管理</h2>
          <p className="text-sm text-muted-foreground mt-1">{currentPeriod.replace("-", "年")}月</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />录入账单</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>录入水电账单</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="type">账单类型</Label>
                  <Select name="type" defaultValue="electric">
                    <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BILL_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="period">账单月份</Label>
                  <Input id="period" name="period" type="month" defaultValue={currentPeriod} required />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>录入方式</Label>
                <div className="flex rounded-lg border overflow-hidden">
                  {(["amount", "reading"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                      {m === "amount" ? "直接输入金额" : "输入读数"}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="mode" value={mode} />
              </div>

              {mode === "amount" ? (
                <div className="grid gap-2">
                  <Label htmlFor="totalAmount">金额 (¥) *</Label>
                  <Input id="totalAmount" name="totalAmount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="readingBefore">上期读数</Label>
                    <Input id="readingBefore" name="readingBefore" type="number" step="0.01" min="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="readingAfter">本期读数</Label>
                    <Input id="readingAfter" name="readingAfter" type="number" step="0.01" min="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unitPrice">单价</Label>
                    <Input id="unitPrice" name="unitPrice" type="number" step="0.001" min="0" />
                  </div>
                  <div className="col-span-3 grid gap-2">
                    <Label htmlFor="totalAmount">或直接输入总金额 (¥)</Label>
                    <Input id="totalAmount" name="totalAmount" type="number" step="0.01" min="0.01" defaultValue="0" />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}录入
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左列：账单列表 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 本月汇总 */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-green-700 p-5 text-white">
            <p className="text-sm opacity-80">{currentPeriod.replace("-", "年")}月 · 账单汇总</p>
            <p className="text-4xl font-extrabold mt-1">¥{totalAmount.toFixed(2)}</p>
            <p className="text-sm opacity-85 mt-1">我的份额 ¥{myShare.toFixed(2)}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{bills.length}</p>
                <p className="text-xs opacity-75 mt-0.5">已录入项目</p>
              </div>
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{members.length}</p>
                <p className="text-xs opacity-75 mt-0.5">分摊人数</p>
              </div>
            </div>
          </div>

          {/* 账单明细 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">账单明细</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bills.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm">本月还没有账单记录</p>
                </div>
              ) : bills.map((bill, i) => (
                <div key={bill.id} className={`flex items-center gap-3 px-4 py-3 ${i < bills.length - 1 ? "border-b" : ""}`}>
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                    {bill.typeIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{bill.typeLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.recordedByName} 录入 · 每人 ¥{(bill.totalAmount / Math.max(bill.splits.length, 1)).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">¥{bill.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-primary">✓ 已录入</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 右列：结算 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">结算台账</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {settlementRoutes.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">暂无待结算金额</div>
              ) : (
                <>
                  {settlementRoutes.map((r, i) => (
                    <div key={i} className={`flex items-center gap-2 px-4 py-3 ${i < settlementRoutes.length - 1 ? "border-b" : ""}`}>
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {r.fromName[0]}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {r.toName[0]}
                      </div>
                      <div className="flex-1 min-w-0 ml-1">
                        <p className="text-xs text-muted-foreground truncate">{r.fromName} → {r.toName}</p>
                      </div>
                      <span className="text-sm font-bold text-destructive shrink-0">¥{r.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="px-4 py-2 bg-muted/50 rounded-b-xl">
                    <p className="text-xs text-muted-foreground">💡 已优化为 {settlementRoutes.length} 笔转账</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 各成员净余额 */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">成员余额</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-0">
              {members.map((m) => {
                const net = memberNet[m.id] ?? 0;
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-green-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name[0]}
                    </div>
                    <span className="flex-1 text-sm">{m.name}</span>
                    <Badge variant={net >= 0 ? "outline" : "destructive"} className="text-xs">
                      {net >= 0 ? `+¥${net.toFixed(2)}` : `-¥${Math.abs(net).toFixed(2)}`}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
