"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow, format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Announcement {
  id: string; title: string; content: string; isPinned: boolean;
  authorName: string; authorId: string; createdAt: string; expiresAt: string | null;
}
interface Visitor {
  id: string; visitorName: string; hostName: string; hostMemberId: string;
  visitDate: string; overnight: boolean; note: string | null;
}
interface Props {
  announcements: Announcement[];
  visitors: Visitor[];
  members: { id: string; name: string }[];
  houseId: string;
}

export function BoardClientPage({ announcements, visitors, members, houseId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [annOpen, setAnnOpen] = useState(false);
  const [visOpen, setVisOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState("");

  async function handleAnnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setError("");
    const fd = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(fd.entries()), isPinned, houseId };
    try {
      const res = await fetch("/api/board/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "发布失败"); return; }
      setAnnOpen(false); setIsPinned(false);
      startTransition(() => router.refresh());
    } catch { setError("网络异常"); }
    finally { setSubmitting(false); }
  }

  async function handleVisSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(fd.entries()),
      overnight: fd.get("overnight") === "on",
      houseId,
    };
    try {
      const res = await fetch("/api/board/visitors", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "登记失败"); return; }
      setVisOpen(false);
      startTransition(() => router.refresh());
    } catch { setError("网络异常"); }
    finally { setSubmitting(false); }
  }

  const pinned = announcements.filter((a) => a.isPinned);
  const normal = announcements.filter((a) => !a.isPinned);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">公告板</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pinned.length > 0 ? `${pinned.length} 条置顶 · ` : ""}{normal.length} 条公告
          </p>
        </div>
        <div className="flex gap-2">
          {/* 访客登记 */}
          <Dialog open={visOpen} onOpenChange={setVisOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><User className="h-4 w-4 mr-2" />登记访客</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>访客登记</DialogTitle></DialogHeader>
              <form onSubmit={handleVisSubmit} className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="hostMemberId">登记人</Label>
                  <Select name="hostMemberId" defaultValue={members[0]?.id}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="visitorName">访客姓名 *</Label>
                  <Input id="visitorName" name="visitorName" placeholder="访客姓名或称呼" required maxLength={30} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="visitDate">到访日期 *</Label>
                  <Input id="visitDate" name="visitDate" type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)} required />
                </div>
                <div className="flex items-center gap-3">
                  <Switch name="overnight" id="overnight" />
                  <Label htmlFor="overnight">过夜</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="note">备注</Label>
                  <Input id="note" name="note" placeholder="可选备注" maxLength={200} />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setVisOpen(false)}>取消</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}登记
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* 发公告 */}
          <Dialog open={annOpen} onOpenChange={setAnnOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />发公告</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>发布公告</DialogTitle></DialogHeader>
              <form onSubmit={handleAnnSubmit} className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="ann-title">标题 *</Label>
                  <Input id="ann-title" name="title" placeholder="一句话说明公告主题" required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ann-content">内容 *</Label>
                  <Textarea id="ann-content" name="content" placeholder="公告详情…" required maxLength={1000} rows={4} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="pin-switch" checked={isPinned} onCheckedChange={setIsPinned} />
                  <Label htmlFor="pin-switch">置顶</Label>
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setAnnOpen(false)}>取消</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}发布
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="announcements">公告 ({announcements.length})</TabsTrigger>
          <TabsTrigger value="visitors">访客记录 ({visitors.length})</TabsTrigger>
        </TabsList>

        {/* 公告列表 */}
        <TabsContent value="announcements" className="mt-4 space-y-3">
          {pinned.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Pin className="h-3 w-3" />置顶
              </p>
              {pinned.map((a) => <AnnCard key={a.id} ann={a} />)}
            </div>
          )}
          {normal.length > 0 && (
            <div className="space-y-2">
              {pinned.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground mt-4">最新公告</p>
              )}
              {normal.map((a) => <AnnCard key={a.id} ann={a} />)}
            </div>
          )}
          {announcements.length === 0 && (
            <div className="text-center py-14 text-muted-foreground">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">还没有任何公告</p>
            </div>
          )}
        </TabsContent>

        {/* 访客记录 */}
        <TabsContent value="visitors" className="mt-4">
          {visitors.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <p className="text-3xl mb-2">🚪</p>
              <p className="text-sm">还没有访客记录</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                {visitors.map((v, i) => (
                  <div key={v.id} className={`flex items-center gap-3 px-4 py-3 ${i < visitors.length - 1 ? "border-b" : ""}`}>
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-base shrink-0">
                      {v.visitorName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{v.visitorName}</p>
                        {v.overnight && (
                          <Badge variant="secondary" className="text-[10px] px-1.5">过夜</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {v.hostName} 的访客 · {format(new Date(v.visitDate), "M月d日")}
                      </p>
                      {v.note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{v.note}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(v.visitDate), { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnnCard({ ann }: { ann: Announcement }) {
  return (
    <Card className={ann.isPinned ? "border-primary/30 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-bold leading-snug">{ann.title}</CardTitle>
          {ann.isPinned && (
            <Badge className="shrink-0 text-[10px] px-1.5 bg-primary/20 text-primary border-0">
              <Pin className="h-2.5 w-2.5 mr-1" />置顶
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {ann.authorName} · {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true, locale: zhCN })}
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ann.content}</p>
      </CardContent>
    </Card>
  );
}
