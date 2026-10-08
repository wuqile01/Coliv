import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/identity";

/** 更新当前用户资料（名称 / 头像） */
export async function PATCH(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body: { name?: unknown; avatarUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const data: { name?: string; avatarUrl?: string | null } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length === 0) {
      return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
    }
    if (name.length > 20) {
      return NextResponse.json({ error: "名称不能超过 20 个字符" }, { status: 400 });
    }
    data.name = name;
  }

  if (body.avatarUrl === null || typeof body.avatarUrl === "string") {
    const url = body.avatarUrl as string | null;
    // 只接受 http(s) 链接或站内相对路径，避免 javascript: 等协议
    if (url !== null && url !== "") {
      const ok = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
      if (!ok) {
        return NextResponse.json({ error: "头像地址无效" }, { status: 400 });
      }
      if (url.length > 500) {
        return NextResponse.json({ error: "头像地址过长" }, { status: 400 });
      }
      data.avatarUrl = url;
    } else {
      data.avatarUrl = null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "没有需要更新的内容" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: identity.userId },
    data,
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  return NextResponse.json({ user: updated });
}

export const dynamic = "force-dynamic";
