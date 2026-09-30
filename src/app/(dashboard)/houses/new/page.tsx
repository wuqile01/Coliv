"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FieldErrors = Record<string, string[] | undefined>;

export default function CreateHousePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? "创建失败");
        return;
      }

      router.push(`/houses/${result.house.id}`);
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  const errorFor = (name: string) => errors[name]?.[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">创建房屋</h2>
          <p className="text-sm text-muted-foreground mt-1">填写基础信息后，你将自动成为房主。</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">房屋信息</CardTitle>
              <CardDescription>后续可在房屋设置中修改。</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="name">房屋名称 *</Label>
              <Input id="name" name="name" placeholder="例如：朝阳合租" required maxLength={30} />
              {errorFor("name") && <p className="text-xs text-destructive">{errorFor("name")}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">地址</Label>
              <Textarea id="address" name="address" placeholder="小区、楼栋和门牌号（仅成员可见）" maxLength={100} />
              {errorFor("address") && <p className="text-xs text-destructive">{errorFor("address")}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="roomCount">房间数量 *</Label>
                <Input id="roomCount" name="roomCount" type="number" defaultValue={3} min={1} max={20} required />
                {errorFor("roomCount") && <p className="text-xs text-destructive">{errorFor("roomCount")}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billDay">每月账单日 *</Label>
                <Input id="billDay" name="billDay" type="number" defaultValue={1} min={1} max={28} required />
                {errorFor("billDay") && <p className="text-xs text-destructive">{errorFor("billDay")}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cleaningCycle">默认清洁周期</Label>
                <Select name="cleaningCycle" defaultValue="weekly">
                  <SelectTrigger id="cleaningCycle"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">每周</SelectItem>
                    <SelectItem value="biweekly">每两周</SelectItem>
                    <SelectItem value="monthly">每月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="defaultSplitMethod">默认分摊方式</Label>
                <Select name="defaultSplitMethod" defaultValue="equal">
                  <SelectTrigger id="defaultSplitMethod"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">按成员均分</SelectItem>
                    <SelectItem value="by_room">按房间均分</SelectItem>
                    <SelectItem value="by_head">按人数均分</SelectItem>
                    <SelectItem value="custom">自定义比例</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {message && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>取消</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建并生成邀请码
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
