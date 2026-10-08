import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth-core";
import { checkBudget } from "@/lib/rate-limit";

/** 登录：邮箱 + 密码 */
export async function POST(request: Request) {
  // 登录尝试限流，防暴力破解
  const limited = checkBudget(request, "signin", 10, 60_000);
  if (limited) return limited;

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求格式错误" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ message: "请输入邮箱和密码" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      members: { where: { leaveDate: null }, select: { houseId: true }, take: 1 },
    },
  });

  // 统一提示，不区分「邮箱不存在」与「密码错误」，避免账号枚举
  const ok = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !ok) {
    return NextResponse.json({ message: "邮箱或密码不正确" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    hasHouse: user.members.length > 0,
  });
}

export const dynamic = "force-dynamic";
