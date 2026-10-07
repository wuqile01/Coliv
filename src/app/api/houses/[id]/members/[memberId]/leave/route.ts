import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 成员退租：设置 leaveDate，保留历史数据（账单、清洁记录等）。
 * 认证暂时跳过：Phase 2 接入后校验操作者权限。
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id, memberId } = await params;

  try {
    const member = await prisma.member.findFirst({
      where: { id: memberId, houseId: id },
      include: { user: true },
    });

    if (!member) return NextResponse.json({ message: "成员不存在" }, { status: 404 });
    if (member.leaveDate) return NextResponse.json({ message: "该成员已退租" }, { status: 409 });

    const activeOwners = await prisma.member.count({
      where: { houseId: id, role: "owner", leaveDate: null },
    });
    if (member.role === "owner" && activeOwners <= 1) {
      return NextResponse.json(
        { message: "房主不能退租，请先转让房主身份" },
        { status: 409 }
      );
    }

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { leaveDate: new Date() },
    });

    await prisma.activityFeed.create({
      data: {
        houseId: id,
        actorMemberId: memberId,
        actionType: "member_left",
        actionData: JSON.stringify({ name: member.user.name }),
      },
    });

    // 释放其未完成的清洁任务
    await prisma.cleaningAssignment.updateMany({
      where: { memberId, status: { in: ["pending", "overdue"] } },
      data: { status: "skipped", skipReason: "成员已退租" },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("POST /api/houses/[id]/members/[memberId]/leave failed", error);
    return NextResponse.json({ message: "退租失败，请稍后重试" }, { status: 500 });
  }
}
