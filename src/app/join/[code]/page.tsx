import Link from "next/link";
import { notFound } from "next/navigation";
import { Home, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinHouseForm } from "@/components/houses/JoinHouseForm";

export default async function JoinHousePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const house = await prisma.house.findUnique({
    where: { inviteCode: code.toUpperCase() },
    include: { _count: { select: { members: true } } },
  });

  if (!house) notFound();

  const isFull = house._count.members >= house.roomCount;

  return (
    <main className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Home className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">加入「{house.name}」</CardTitle>
          <CardDescription>确认房屋信息后填写房间号，点击加入。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 房屋信息概览 */}
          <div className="rounded-xl border divide-y text-sm">
            <div className="flex items-center justify-between p-3">
              <span className="text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />当前成员
              </span>
              <Badge variant={isFull ? "destructive" : "secondary"}>
                {house._count.members} / {house.roomCount} 人
              </Badge>
            </div>
            {house.address && (
              <div className="flex items-start justify-between gap-4 p-3">
                <span className="text-muted-foreground flex items-center gap-2 shrink-0">
                  <MapPin className="h-4 w-4" />地址
                </span>
                <span className="text-right">{house.address}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3">
              <span className="text-muted-foreground">邀请码</span>
              <code className="font-bold tracking-[0.16em]">{house.inviteCode}</code>
            </div>
          </div>

          {isFull ? (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
              该房屋成员已满，无法加入。
            </div>
          ) : (
            <JoinHouseForm prefillCode={house.inviteCode} />
          )}

          <Button asChild variant="ghost" className="w-full">
            <Link href="/">返回首页</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
