import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth-core";

/**
 * 当前登录身份解析
 *
 * 会话来源：coliv_session cookie（HMAC 签名，见 auth-core.ts）。
 * 一个用户可以属于多个房屋；houses 列表按加入时间排序，
 * currentHouse 取第一个（后续可加「切换房屋」）。
 */

export type Identity = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  /** 当前操作的房屋 */
  houseId: string | null;
  memberId: string | null;
  /** 是否为当前房屋的房主 */
  isOwner: boolean;
  /** 用户加入的所有房屋（含角色），用于引导页与切换 */
  houses: { houseId: string; houseName: string; memberId: string; role: string }[];
};

/** 读取当前会话对应的 userId；未登录返回 null */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/** 当前身份；未登录或用户不存在返回 null */
export async function getCurrentIdentity(): Promise<Identity | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      members: {
        where: { leaveDate: null },
        include: { house: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user) return null;

  const houses = user.members.map((m) => ({
    houseId: m.houseId,
    houseName: m.house.name,
    memberId: m.id,
    role: m.role,
  }));

  // 优先选房主身份所在的房屋；否则取最早加入的
  const primary = user.members.find((m) => m.role === "owner") ?? user.members[0];

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    houseId: primary?.houseId ?? null,
    memberId: primary?.id ?? null,
    isOwner: primary?.role === "owner",
    houses,
  };
}

/**
 * 页面用：要求已登录，否则跳转登录页。
 * 未加入任何房屋的情况不在这里拦截 —— 由 (dashboard)/layout 引导到 /onboarding。
 */
export async function requireIdentity(): Promise<Identity> {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/signin");
  return identity;
}

/** 当前房屋；没有房屋返回 null */
export async function getCurrentHouse() {
  const identity = await getCurrentIdentity();
  if (!identity?.houseId) return null;
  return prisma.house.findUnique({ where: { id: identity.houseId } });
}

/**
 * API 用：当前房屋 + 在住成员 + 当前成员。
 * 未登录或没有房屋时返回 null，调用方应回 401/404。
 */
export async function getCurrentContext() {
  const identity = await getCurrentIdentity();
  if (!identity?.houseId || !identity.memberId) return null;

  const [house, members] = await Promise.all([
    prisma.house.findUnique({ where: { id: identity.houseId } }),
    prisma.member.findMany({
      where: { houseId: identity.houseId, leaveDate: null },
      include: { user: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!house) return null;

  const currentMember = members.find((m) => m.id === identity.memberId) ?? null;
  return { identity, house, members, currentMember };
}

/**
 * 校验「当前用户是否为指定房屋的房主」。
 * API 用：返回 null 表示通过，否则返回错误响应信息。
 */
export async function checkIsOwner(
  houseId: string
): Promise<{ status: number; message: string } | null> {
  const identity = await getCurrentIdentity();
  if (!identity) return { status: 401, message: "未登录" };
  const isMemberOfHouse = identity.houses.some((h) => h.houseId === houseId);
  if (!isMemberOfHouse) return { status: 403, message: "你不是该房屋的成员" };
  const role = identity.houses.find((h) => h.houseId === houseId)?.role;
  if (role !== "owner") return { status: 403, message: "仅房主可执行此操作" };
  return null;
}
