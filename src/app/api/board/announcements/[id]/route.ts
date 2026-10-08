import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentContext } from "@/lib/identity";

/**
 * 单条公告操作
 *
 * 权限规则：
 *   - 删除 / 置顶：房主，或公告作者本人
 *   - 编辑：仅公告作者本人
 *   - 所有操作都要求公告属于当前房屋
 */

const patchSchema = z
  .object({
    title: z.string().trim().min(1, "标题不能为空").max(50).optional(),
    content: z.string().trim().min(1, "内容不能为空").max(1000).optional(),
    isPinned: z.boolean().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "没有需要更新的字段" });

/** 取公告并校验归属当前房屋 */
async function loadAnnouncement(id: string, houseId: string) {
  const ann = await prisma.announcement.findUnique({
    where: { id },
    include: { author: { select: { id: true, userId: true } } },
  });
  if (!ann) return { error: { status: 404, message: "公告不存在" } as const };
  if (ann.houseId !== houseId) {
    return { error: { status: 403, message: "公告不属于你的房屋" } as const };
  }
  return { ann };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getCurrentContext();
  if (!ctx?.currentMember) {
    return NextResponse.json({ message: "未登录或未加入房屋" }, { status: 401 });
  }

  const loaded = await loadAnnouncement(id, ctx.house.id);
  if (loaded.error) {
    return NextResponse.json({ message: loaded.error.message }, { status: loaded.error.status });
  }
  const ann = loaded.ann;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求格式错误" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "参数校验失败" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const isAuthor = ann.authorId === ctx.currentMember.id;
  const isOwner = ctx.identity.isOwner;

  // 编辑（改标题/内容）：仅作者本人
  const editingContent = data.title !== undefined || data.content !== undefined;
  if (editingContent && !isAuthor) {
    return NextResponse.json({ message: "只能编辑自己发布的公告" }, { status: 403 });
  }

  // 置顶/取消置顶：房主或作者
  if (data.isPinned !== undefined && !isOwner && !isAuthor) {
    return NextResponse.json({ message: "只有房主或发布者可以置顶" }, { status: 403 });
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
      ...(data.expiresAt !== undefined
        ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
        : {}),
    },
  });

  return NextResponse.json({ announcement: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getCurrentContext();
  if (!ctx?.currentMember) {
    return NextResponse.json({ message: "未登录或未加入房屋" }, { status: 401 });
  }

  const loaded = await loadAnnouncement(id, ctx.house.id);
  if (loaded.error) {
    return NextResponse.json({ message: loaded.error.message }, { status: loaded.error.status });
  }
  const ann = loaded.ann;

  const isAuthor = ann.authorId === ctx.currentMember.id;
  const isOwner = ctx.identity.isOwner;
  if (!isAuthor && !isOwner) {
    return NextResponse.json({ message: "只能删除自己发布的公告" }, { status: 403 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
