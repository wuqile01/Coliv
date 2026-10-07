"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HouseSettingsFormProps {
  houseId: string;
  defaults: {
    name: string;
    address: string;
    roomCount: number;
    billDay: number;
    cleaningCycle: string;
    defaultSplitMethod: string;
  };
}

export function HouseSettingsForm({ houseId, defaults }: HouseSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});

    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch(`/api/houses/${houseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors ?? {});
        setMessage({ type: "err", text: data.message ?? "保存失败" });
        return;
      }
      setMessage({ type: "ok", text: "已保存" });
    } catch {
      setMessage({ type: "err", text: "网络异常，请稍后重试" });
    } finally {
      setSaving(false);
    }
  }

  const errorFor = (name: string) => errors[name]?.[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="name">房屋名称 *</Label>
        <Input id="name" name="name" defaultValue={defaults.name} required maxLength={30} />
        {errorFor("name") && <p className="text-xs text-destructive">{errorFor("name")}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">地址</Label>
        <Textarea id="address" name="address" defaultValue={defaults.address} maxLength={100} />
        {errorFor("address") && <p className="text-xs text-destructive">{errorFor("address")}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="roomCount">房间数量 *</Label>
          <Input id="roomCount" name="roomCount" type="number" defaultValue={defaults.roomCount} min={1} max={20} required />
          {errorFor("roomCount") && <p className="text-xs text-destructive">{errorFor("roomCount")}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="billDay">每月账单日 *</Label>
          <Input id="billDay" name="billDay" type="number" defaultValue={defaults.billDay} min={1} max={28} required />
          {errorFor("billDay") && <p className="text-xs text-destructive">{errorFor("billDay")}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cleaningCycle">清洁周期</Label>
          <Select name="cleaningCycle" defaultValue={defaults.cleaningCycle}>
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
          <Select name="defaultSplitMethod" defaultValue={defaults.defaultSplitMethod}>
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

      {message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${message.type === "ok" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          保存设置
        </Button>
      </div>
    </form>
  );
}
