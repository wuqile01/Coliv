import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth-core";
import { checkBudget } from "@/lib/rate-limit";

/** 注册：邮箱 + 密码 */
export async function POST(request: Request) {
  // 简单限流：同一 IP 每分钟最多 10 次注册尝试
  const limited = checkBudget(request, "signup", 10, 60_000);
  if (limited) return limited;

  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求格式错误" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 1 || name.length > 20) {
    return NextResponse.json({ message: "昵称需为 1-20 个字符" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ message: "密码至少 6 位" }, { status: 400 });
  }
  if (password.length > 72) {
    return NextResponse.json({ message: "密码过长" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "该邮箱已注册" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ user, hasHouse: false });
}

export const dynamic = "force-dynamic";
