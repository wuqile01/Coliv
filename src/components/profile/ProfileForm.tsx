"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AVATAR_PRESETS = [
  "🧑", "👩", "🧑‍💻", "👨‍🍳", "🧑‍🎨", "🐱", "🐶", "🌱",
];

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; avatarUrl: string | null; isOwner: boolean };
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isEmojiAvatar = !!avatarUrl && !avatarUrl.startsWith("http") && !avatarUrl.startsWith("/");

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    // 演示环境：前端转 base64 直接存库（生产应改为上传到对象存储）
    if (file.size > 300 * 1024) {
      setError("图片请控制在 300KB 以内");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result));
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存失败");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">基本信息</CardTitle>
        <CardDescription>修改后，室友在成员列表和动态里会看到新的头像与名称。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 头像 */}
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            {avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("/") || avatarUrl.startsWith("data:")) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="头像"
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <span className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-white text-2xl font-bold select-none">
                {isEmojiAvatar ? avatarUrl : name.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={pickFile}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />上传图片
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAvatarUrl(null)}
                >
                  重置
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">支持 JPG/PNG，300KB 以内</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {/* 预设 emoji 头像 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">或选一个头像</Label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatarUrl(emoji)}
                className={`w-10 h-10 rounded-full text-xl flex items-center justify-center border transition-colors ${
                  avatarUrl === emoji
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-muted hover:bg-muted/70"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 名称 */}
        <div className="grid gap-2">
          <Label htmlFor="name">昵称</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="你的名字"
          />
          <p className="text-xs text-muted-foreground">最多 20 个字符</p>
        </div>

        {/* 邮箱（只读） */}
        <div className="grid gap-2">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" value={user.email} readOnly disabled />
          <p className="text-xs text-muted-foreground">邮箱作为登录凭证，暂不支持修改</p>
        </div>

        {error && (
          <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || name.trim() === ""}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存修改
          </Button>
          {saved && (
            <span className="text-sm text-primary flex items-center gap-1">
              <Check className="h-4 w-4" />已保存
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
