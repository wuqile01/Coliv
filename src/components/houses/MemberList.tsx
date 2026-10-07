"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, MoreVertical, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MemberItem {
  id: string;
  role: string;
  roomNumber: string | null;
  joinDate: Date | string;
  user: { name: string; email: string };
}

interface MemberListProps {
  houseId: string;
  members: MemberItem[];
  houseOwnerId: string;
}

export function MemberList({ houseId, members, houseOwnerId }: MemberListProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<MemberItem | null>(null);
  const [leaving, setLeaving] = useState<MemberItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function saveMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/houses/${houseId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: editing.id,
        roomNumber: fd.get("roomNumber"),
        role: fd.get("role"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "保存失败");
      setBusy(false);
      return;
    }

    setBusy(false);
    setEditing(null);
    router.refresh();
  }

  async function confirmLeave() {
    if (!leaving) return;
    setBusy(true);
    setError("");

    const res = await fetch(`/api/houses/${houseId}/members/${leaving.id}/leave`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "退租失败");
      setBusy(false);
      return;
    }

    setBusy(false);
    setLeaving(null);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl border p-3">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
              {m.user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                {m.user.name}
                {m.id === houseOwnerId && <Crown className="h-3.5 w-3.5 text-amber-500" />}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {m.roomNumber ? `${m.roomNumber} 号房` : "房间待分配"} · 加入于{" "}
                {new Date(m.joinDate).toLocaleDateString("zh-CN")}
              </p>
            </div>
            <Badge variant={m.role === "owner" ? "default" : m.role === "admin" ? "secondary" : "outline"}>
              {m.role === "owner" ? "房主" : m.role === "admin" ? "管理员" : "成员"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setError(""); }}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* 编辑成员 */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>管理成员</DialogTitle>
            <DialogDescription>{editing?.user.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveMember} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="roomNumber">房间号</Label>
              <Input
                id="roomNumber"
                name="roomNumber"
                defaultValue={editing?.roomNumber ?? ""}
                placeholder="例如：主卧、次卧1"
                maxLength={10}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">角色</Label>
              <Select name="role" defaultValue={editing?.role ?? "member"}>
                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">房主</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="member">成员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={() => { setLeaving(editing); setEditing(null); setError(""); }}
              >
                <UserMinus className="h-4 w-4 mr-2" />办理退租
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 退租确认 */}
      <Dialog open={!!leaving} onOpenChange={(open) => !open && setLeaving(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认退租</DialogTitle>
            <DialogDescription>
              {leaving?.user.name} 将退出房屋，历史账单与清洁记录会保留，未完成的清洁任务会被跳过。
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setLeaving(null)} disabled={busy}>取消</Button>
            <Button variant="destructive" onClick={confirmLeave} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}确认退租
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
