"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DemoUser = { id: string; name: string; email: string; role: string };

/**
 * 演示模式登录页
 *
 * 演示数据中的账号没有设置密码（Account 表为空），
 * 所以这里不做密码校验，改为直接选择以谁的身份进入。
 * 选择结果写入 coliv_uid cookie，由 getCurrentIdentity 读取。
 */
export default function SignInPage() {
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[] | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/demo-accounts")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  async function choose(user: DemoUser) {
    setLoading(user.id);
    const res = await fetch("/api/demo-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setLoading(null);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
          Co
        </div>
        <CardTitle className="text-xl">进入 CoLiv</CardTitle>
        <CardDescription>选择一个账号体验</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {users === null && (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {users?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            暂无账号数据，请先运行 seed。
          </p>
        )}

        {users?.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => choose(u)}
            disabled={!!loading}
            className="w-full flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors text-left disabled:opacity-60"
          >
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-white font-bold shrink-0">
              {u.name.slice(0, 1)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">{u.name}</span>
                {u.role === "owner" && (
                  <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
              </span>
              <span className="block text-xs text-muted-foreground truncate">{u.email}</span>
            </span>
            {loading === u.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            ) : (
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-2 leading-relaxed">
          演示模式：账号未设置密码，直接选择即可进入。
          <br />
          房主「张三」可修改房屋设置与管理成员。
        </p>
      </CardContent>
    </Card>
  );
}
