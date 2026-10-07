import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Settings, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteCard } from "@/components/houses/InviteCard";
import { MemberList } from "@/components/houses/MemberList";

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
        where: { leaveDate: null },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!house) notFound();

  const ownerMember = house.members.find((m) => m.role === "owner");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{house.name}</h2>
            <Badge variant="outline">{house.members.length} / {house.roomCount} 人</Badge>
          </div>
          {house.address && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {house.address}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/houses/${house.id}/settings`}><Settings className="h-4 w-4 mr-2" />房屋设置</Link>
          </Button>
          <Button asChild>
            <Link href="/join"><UserPlus className="h-4 w-4 mr-2" />邀请室友</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />房屋成员</CardTitle>
            <CardDescription>房主可以调整房间号、角色，或为成员办理退租。</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberList
              houseId={house.id}
              houseOwnerId={ownerMember?.id ?? ""}
              members={house.members.map((m) => ({
                id: m.id,
                role: m.role,
                roomNumber: m.roomNumber,
                joinDate: m.joinDate,
                user: m.user,
              }))}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <InviteCard houseId={house.id} houseName={house.name} inviteCode={house.inviteCode} />

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
