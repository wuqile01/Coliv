"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export function TopHeader({ houseName = "朝阳合租" }: { houseName?: string }) {
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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-white text-sm font-bold select-none">
          张
        </div>
      </div>
    </header>
  );
}
