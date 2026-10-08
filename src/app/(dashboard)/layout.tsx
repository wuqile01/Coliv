import { redirect } from "next/navigation";
import { Sidebar, BottomTabBar } from "@/components/shared/Navigation";
import { TopHeader } from "@/components/shared/TopHeader";
import { getCurrentIdentity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";

// 所有页面均依赖数据库实时数据，禁用构建期预渲染
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 中间件只做 cookie 外形粗筛，这里做真实验签：
  // 签名无效或用户已删除时，身份为 null，需重新登录
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/signin");

  const house = identity.houseId
    ? await prisma.house.findUnique({ where: { id: identity.houseId } })
    : null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* 桌面端：左侧 Sidebar */}
      <Sidebar />

      {/* 右侧主区域 */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopHeader
          houseName={house?.name ?? "CoLiv"}
          user={{
            name: identity.name,
            email: identity.email,
            avatarUrl: identity.avatarUrl,
            isOwner: identity.isOwner,
          }}
        />

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
