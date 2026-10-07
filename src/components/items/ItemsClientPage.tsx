"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface ItemSplit { memberId: string; memberName: string; amount: number; }

interface Item {
  id: string;
  type: string;
  name: string;
  price: number;
  purchaseDate: string;
  photoUrl: string | null;
  ownership: string;
  splitMethod: string;
  lowStock: boolean;
  purchaserName: string;
  purchaserId: string;
  splits: ItemSplit[];
}

interface ItemsClientPageProps {
  items: Item[];
  members: { id: string; name: string }[];
  houseId: string;
}

export function ItemsClientPage({ items, members, houseId }: ItemsClientPageProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const consumables = items.filter((i) => i.type === "consumable");
  const durables = items.filter((i) => i.type === "durable");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, houseId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "登记失败"); return; }
      setOpen(false);
      startTransition(() => router.refresh());
    } catch { setError("网络异常"); }
    finally { setSubmitting(false); }
  }

  function renderItem(item: Item) {
    const myShare = item.splits[0]?.amount ?? 0;
    return (
      <div key={item.id} className="flex items-center gap-3 p-3 border-b last:border-0">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
          {item.type === "consumable" ? "🛒" : "📦"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{item.name}</p>
            {item.lowStock && <Badge variant="destructive" className="text-[10px] px-1.5">补货</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.purchaserName} · {format(new Date(item.purchaseDate), "M月d日")} · 我的份额 ¥{myShare.toFixed(2)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">¥{item.price.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{item.splits.length} 人均摊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">公共物品</h2>
          <p className="text-sm text-muted-foreground mt-1">{items.length} 件物品</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />登记采购</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>登记采购</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="name">物品名称 *</Label>
                <Input id="name" name="name" placeholder="例如：纸巾、洗洁精…" required maxLength={30} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="type">类型</Label>
                  <Select name="type" defaultValue="consumable">
                    <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consumable">消耗品</SelectItem>
                      <SelectItem value="durable">耐用品</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">价格 (¥) *</Label>
                  <Input id="price" name="price" type="number" step="0.01" min="0.01" required placeholder="0.00" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">购买日期 *</Label>
                <Input id="purchaseDate" name="purchaseDate" type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="splitMethod">分摊方式</Label>
                <Select name="splitMethod" defaultValue="equal">
                  <SelectTrigger id="splitMethod"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">均分</SelectItem>
                    <SelectItem value="purchaser_only">仅我承担</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}登记
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="consumable">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="consumable">消耗品 ({consumables.length})</TabsTrigger>
          <TabsTrigger value="durable">耐用品 ({durables.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="consumable" className="mt-4">
          {consumables.length === 0
            ? <div className="text-center py-12 text-muted-foreground"><ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">还没有消耗品记录</p></div>
            : <Card><CardContent className="p-0">{consumables.map(renderItem)}</CardContent></Card>
          }
        </TabsContent>
        <TabsContent value="durable" className="mt-4">
          {durables.length === 0
            ? <div className="text-center py-12 text-muted-foreground"><ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">还没有耐用品记录</p></div>
            : <Card><CardContent className="p-0">{durables.map(renderItem)}</CardContent></Card>
          }
        </TabsContent>
      </Tabs>
    </div>
  );
}
