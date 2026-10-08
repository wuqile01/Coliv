"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, UserRound, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeaderUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
  isOwner: boolean;
};

/**
 * 顶部栏
 *
 * - 左侧：房屋名称
 * - 右侧：公告入口 + 用户头像菜单
 *
 * 头像菜单用原生实现（不依赖 radix dropdown），
 * 因为演示模式下需要保证在任何环境下都能正常展开。
 */
export function TopHeader({
  houseName = "CoLiv",
  user,
}: {
  houseName?: string;
  user?: HeaderUser | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const displayName = user?.name ?? "未登录";
  const initial = displayName.slice(0, 1);

  async function handleSignOut() {
    setOpen(false);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      // 忽略网络错误，仍然跳转
    }
    router.push("/signin");
    router.refresh();
  }

  function handleSwitchAccount() {
    setOpen(false);
    router.push("/signin");
  }

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="md:hidden w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
          Co
        </div>
        <h1 className="font-semibold text-sm md:text-base truncate max-w-[140px] sm:max-w-none">
          {houseName}
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
        <Link
          href="/board"
          className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          aria-label="公告板"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Link>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl pl-1 pr-1.5 h-10 transition-colors",
              open ? "bg-muted" : "hover:bg-muted"
            )}
            aria-label="账号菜单"
            aria-expanded={open}
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-white text-sm font-bold select-none">
                {initial}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border bg-background shadow-lg overflow-hidden z-50">
              {/* 账号信息 */}
              <div className="px-4 py-3 border-b bg-muted/30">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? "—"}</p>
                {user?.isOwner && (
                  <span className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    房主
                  </span>
                )}
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  编辑个人资料
                </Link>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  切换账号
                </button>
              </div>

              <div className="border-t py-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
