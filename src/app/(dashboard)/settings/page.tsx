import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * /settings 重定向到当前房屋的设置页
 *
 * 侧边栏的「设置」链接指向 /settings，但设置页实际挂在
 * /houses/[id]/settings 下。这里查出当前房屋后做一次重定向。
 */
export default async function SettingsRedirectPage() {
  const house = await prisma.house.findFirst({ where: { name: "朝阳合租" } });
  if (!house) {
    return (
      <div className="p-4 text-muted-foreground">未找到房屋数据，请先运行 seed。</div>
    );
  }
  redirect(`/houses/${house.id}/settings`);
}
