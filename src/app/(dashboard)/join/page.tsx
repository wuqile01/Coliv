import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinHouseForm } from "@/components/houses/JoinHouseForm";
import { Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  return (
    <div className="max-w-md mx-auto mt-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">加入房屋</h2>
        <p className="text-sm text-muted-foreground mt-1">输入室友分享的邀请码即可加入。</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">输入邀请码</CardTitle>
              <CardDescription>房主可以在房屋详情页找到邀请码。</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <JoinHouseForm />
        </CardContent>
      </Card>

      <Button asChild variant="ghost" className="w-full">
        <Link href="/">← 返回首页</Link>
      </Button>
    </div>
  );
}
