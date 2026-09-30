import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, MapPin, Settings, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cycleLabels: Record<string, string> = {
  weekly: "每周",
  biweekly: "每两周",
  monthly: "每月",
};

const splitLabels: Record<string, string> = {
  equal: "按成员均分",
  by_room: "按房间均分",
  by_head: "按人数均分",
  custom: "自定义比例",
};

export default async function HouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const house = await prisma.house.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!house) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{house.name}</h2>
            <Badge variant="outline">{house.members.length} 人</Badge>
          </div>
          {house.address && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {house.address}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Settings className="h-4 w-4 mr-2" />房屋设置</Button>
          <Button><UserPlus className="h-4 w-4 mr-2" />邀请室友</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />房屋成员</CardTitle>
            <CardDescription>房主可以管理成员与房间。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {house.members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {member.user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">{member.roomNumber ? `${member.roomNumber} 号房` : "房间待分配"}</p>
                </div>
                <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                  {member.role === "owner" ? "房主" : "成员"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">邀请码</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl bg-muted p-4">
                <code className="text-xl font-bold tracking-[0.18em]">{house.inviteCode}</code>
                <Button size="icon" variant="ghost" aria-label="复制邀请码"><Copy className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">将邀请码分享给室友即可加入。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">默认规则</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">房间数量</span><span>{house.roomCount} 间</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">账单日</span><span>每月 {house.billDay} 日</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">清洁周期</span><span>{cycleLabels[house.cleaningCycle]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">分摊方式</span><span>{splitLabels[house.defaultSplitMethod]}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Link href="/" className="text-sm text-primary hover:underline">← 返回首页</Link>
    </div>
  );
}
