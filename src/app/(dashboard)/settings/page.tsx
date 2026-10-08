import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * /settings 重定向到房屋主页
 *
 * 侧边栏「设置」进入的是房屋管理主页（成员列表、邀请码、默认规则、
 * 房屋设置入口），而不是直接落到编辑表单页。
 * 编辑表单在 /houses/[id]/settings，从房屋主页的「房屋设置」按钮进入。
 */
export default async function SettingsRedirectPage() {
  const house = await prisma.house.findFirst({ where: { name: "朝阳合租" } });
  if (!house) {
    return (
      <div className="p-4 text-muted-foreground">未找到房屋数据，请先运行 seed。</div>
    );
  }
  redirect(`/houses/${house.id}`);
}
