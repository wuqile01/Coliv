import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/identity";

/** 判断当前用户是否为指定房屋的房主 */
async function assertOwner(houseId: string) {
  const identity = await getCurrentIdentity();
  if (!identity) return { ok: false as const, status: 401, message: "未登录" };
  if (identity.houseId !== houseId || !identity.isOwner) {
    return { ok: false as const, status: 403, message: "仅房主可执行此操作" };
  }
  return { ok: true as const };
}

const updateMemberSchema = z.object({
  roomNumber: z.string().trim().max(10).optional(),
  role: z.enum(["owner", "admin", "member"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const members = await prisma.member.findMany({
    where: { houseId: id, leaveDate: null },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const perm = await assertOwner(id);
  if (!perm.ok) return NextResponse.json({ message: perm.message }, { status: perm.status });

  const body = await request.json();
  const memberId: string = body.memberId;

  if (!memberId) return NextResponse.json({ message: "缺少 memberId" }, { status: 400 });

  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "参数校验失败", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, houseId: id } });
  if (!member) return NextResponse.json({ message: "成员不存在" }, { status: 404 });

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: parsed.data,
  });
  return NextResponse.json({ member: updated });
}
