import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, UserPlus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";

/**
 * 新手引导：注册后或未加入任何房屋时的落地页。
 * 两条路 —— 自己建房（成为房主）或输入邀请码加入室友的房屋。
 */
export default async function OnboardingPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/signin");

  // 已有房屋的用户不需要引导
  if (identity.houses.length > 0) redirect("/");

  return (
    <div className="max-w-md mx-auto mt-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">你好，{identity.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          还没加入任何房屋，先选一条路开始吧
        </p>
      </div>

      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">创建我的房屋</CardTitle>
              <CardDescription>你是房主，可管理成员与房屋设置</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/houses/new">
              创建房屋 <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">加入室友的房屋</CardTitle>
              <CardDescription>输入房主分享的邀请码即可</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/join">
              输入邀请码 <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        提示：同一个账号只能在一个房屋内使用当前版本，
        <br />
        多房屋切换在后续版本支持。
      </p>
    </div>
  );
}
