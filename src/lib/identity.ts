import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * 当前登录身份解析
 *
 * 背景：认证（Better Auth）尚未接入，演示数据也没有密码。
 * 目前用 cookie（coliv_uid）记录「当前以谁的身份浏览」，
 * 由登录页的账号选择器写入，头像菜单的「切换账号」清空。
 *
 * 接入真实认证后，只需把 resolveIdentity 改为读取 session 即可，
 * 上层调用方（权限判断、头像菜单）无需改动。
 */

/** 演示模式下记录当前身份的 cookie 名 */
export const IDENTITY_COOKIE = "coliv_uid";

export type Identity = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  houseId: string | null;
  memberId: string | null;
  /** 是否为该房屋的房主 —— 只有房主能改房屋设置、管理成员 */
  isOwner: boolean;
};

const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL ?? "zhang@test.com";

/**
 * 解析当前身份：
 * 1. 优先读 cookie 中指定的 userId（「切换账号」后写入）
 * 2. 退回 DEMO_USER_EMAIL 指定的用户
 * 3. 再退回第一个用户，保证页面不崩
 */
export async function getCurrentIdentity(): Promise<Identity | null> {
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get(IDENTITY_COOKIE)?.value;

  const user =
    (cookieUserId
      ? await prisma.user.findUnique({ where: { id: cookieUserId } })
      : null) ??
    (await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!user) return null;

  const member = await prisma.member.findFirst({
    where: { userId: user.id, leaveDate: null },
    orderBy: { createdAt: "asc" },
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    houseId: member?.houseId ?? null,
    memberId: member?.id ?? null,
    isOwner: member?.role === "owner",
  };
}

/** 取当前用户所属房屋；找不到时返回 null */
export async function getCurrentHouse() {
  const identity = await getCurrentIdentity();
  if (!identity?.houseId) return null;
  return prisma.house.findUnique({ where: { id: identity.houseId } });
}
