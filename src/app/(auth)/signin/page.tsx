"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "登录失败");
        setLoading(false);
        return;
      }

      // 没加入任何房屋的新用户 → 走引导页
      const redirectTo = searchParams.get("redirect");
      router.push(redirectTo || (data.hasHouse ? "/" : "/onboarding"));
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
          Co
        </div>
        <CardTitle className="text-xl">登录 CoLiv</CardTitle>
        <CardDescription>用邮箱和密码登录你的合租空间</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="请输入密码"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            登录
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            注册
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  // useSearchParams 需要 Suspense 边界（Next.js 15 要求）
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-80 animate-pulse rounded-xl bg-muted" />}>
      <SignInForm />
    </Suspense>
  );
}
