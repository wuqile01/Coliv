"use client";

import { Bell } from "lucide-react";

interface TopHeaderProps {
  houseName?: string;
}

export function TopHeader({ houseName = "朝阳合租" }: TopHeaderProps) {
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40">
      {/* 房屋名（移动端显示，桌面端 sidebar 已有 logo） */}
      <div className="flex items-center gap-2">
        <div className="md:hidden w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
          Co
        </div>
        <h1 className="font-semibold text-base">{houseName}</h1>
        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
          3人
        </span>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-2">
        {/* 通知铃铛 */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {/* 未读红点 */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* 头像 */}
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-white text-sm font-bold">
          张
        </button>
      </div>
    </header>
  );
}
