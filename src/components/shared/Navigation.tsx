"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  Wallet,
  Wrench,
  Megaphone,
  ShoppingBag,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/cleaning", icon: Sparkles, label: "清洁" },
  { href: "/expenses", icon: Wallet, label: "费用" },
  { href: "/repairs", icon: Wrench, label: "维修" },
  { href: "/board", icon: Megaphone, label: "公告板" },
  { href: "/items", icon: ShoppingBag, label: "公共物品" },
];

// 移动端底部 Tab（只显示前4个 + 更多）
const mobileTabItems = navItems.slice(0, 4);

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r bg-background h-screen sticky top-0 shrink-0 transition-all duration-200">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          Co
        </div>
        <span className="ml-3 font-bold text-base hidden lg:block">CoLiv</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-colors group",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block">{label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 ml-auto hidden lg:block opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="py-3 px-2 border-t">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-colors",
            isActive("/settings", pathname)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="hidden lg:block">设置</span>
        </Link>
      </div>
    </aside>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur-sm">
      {mobileTabItems.map(({ href, icon: Icon, label }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
      {/* 更多（跳转公共物品） */}
      <Link
        href="/items"
        className={cn(
          "flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
          isActive("/items", pathname) ? "text-primary" : "text-muted-foreground"
        )}
      >
        <ShoppingBag className="h-5 w-5" />
        物品
      </Link>
    </nav>
  );
}
