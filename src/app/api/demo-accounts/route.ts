import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IDENTITY_COOKIE } from "@/lib/identity";

/**
 * 演示模式账号列表 / 身份切换
 *
 * 演示数据的账号没有密码（Account 表为空），无法走真实登录。
 * 这两个接口只用于演示环境，接入正式认证后应删除。
 */

/** 列出所有演示账号及其在房屋中的角色 */
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      members: {
        where: { leaveDate: null },
        select: { role: true },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.members[0]?.role ?? "member",
    })),
  });
}

/** 切换到指定账号：写入 cookie */
export async function POST(request: Request) {
  let body: { userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId : null;
  if (!userId) {
    return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(IDENTITY_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
}

/** 退出：清除身份 cookie */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(IDENTITY_COOKIE);
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
