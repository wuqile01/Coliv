import { Sidebar, BottomTabBar } from "@/components/shared/Navigation";
import { TopHeader } from "@/components/shared/TopHeader";

// 所有页面均依赖数据库实时数据，禁用构建期预渲染
// 否则 Vercel 构建时会尝试连接数据库，导致构建失败
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* 桌面端：左侧 Sidebar */}
      <Sidebar />

      {/* 右侧主区域 */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopHeader />

        {/* 内容区：桌面端 padding 更大，有最大宽度约束 */}
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 pb-20 md:pb-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 移动端：底部 Tab Bar */}
      <BottomTabBar />
    </div>
  );
}
