"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinFormProps {
  prefillCode?: string;
}

export function JoinHouseForm({ prefillCode = "" }: JoinFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const payload = { inviteCode: fd.get("inviteCode"), roomNumber: fd.get("roomNumber") };

    try {
      const res = await fetch("/api/houses/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "加入失败");
        return;
      }

      router.push(`/houses/${data.houseId}`);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="inviteCode">邀请码 *</Label>
        <Input
          id="inviteCode"
          name="inviteCode"
          defaultValue={prefillCode}
          placeholder="输入 8 位邀请码，不区分大小写"
          required
          maxLength={16}
          className="tracking-[0.12em] font-mono text-base uppercase"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="roomNumber">
          我的房间号 <span className="text-muted-foreground text-xs">（可选）</span>
        </Label>
        <Input id="roomNumber" name="roomNumber" placeholder="例如：主卧、次卧1、202…" maxLength={10} />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        加入房屋
      </Button>
    </form>
  );
}
