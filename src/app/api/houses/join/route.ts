import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const DEMO_USER_EMAIL = "zhang@test.com";

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4, "邀请码格式不正确").max(16, "邀请码格式不正确"),
  roomNumber: z.string().trim().max(10, "房间号最多 10 个字符").optional().default(""),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = joinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "表单校验失败", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const house = await prisma.house.findUnique({
      where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
    });

    if (!house) {
      return NextResponse.json({ message: "邀请码无效或已失效" }, { status: 404 });
    }

    // 认证暂时跳过：Phase 2 接入后从 session 获取用户。
    const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
    if (!user) {
      return NextResponse.json(
        { message: "演示用户不存在，请先执行 npm run db:seed" },
        { status: 409 }
      );
    }

    const existing = await prisma.member.findUnique({
      where: { houseId_userId: { houseId: house.id, userId: user.id } },
    });

    if (existing && !existing.leaveDate) {
      return NextResponse.json(
        { message: "你已经是该房屋成员", houseId: house.id },
        { status: 409 }
      );
    }

    const roomCount = await prisma.member.count({
      where: { houseId: house.id, leaveDate: null },
    });

    if (roomCount >= house.roomCount) {
      return NextResponse.json(
        { message: `房屋成员已满（${house.roomCount} 人间）` },
        { status: 409 }
      );
    }

    const member = existing
      ? await prisma.member.update({
          where: { id: existing.id },
          data: { leaveDate: null, joinDate: new Date(), roomNumber: parsed.data.roomNumber || existing.roomNumber },
        })
      : await prisma.member.create({
          data: {
            houseId: house.id,
            userId: user.id,
            roomNumber: parsed.data.roomNumber || null,
            role: "member",
            joinDate: new Date(),
          },
        });

    await prisma.activityFeed.create({
      data: {
        houseId: house.id,
        actorMemberId: member.id,
        actionType: "member_joined",
        actionData: JSON.stringify({ name: user.name }),
      },
    });

    return NextResponse.json({ houseId: house.id, memberId: member.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/houses/join failed", error);
    return NextResponse.json({ message: "加入房屋失败，请稍后重试" }, { status: 500 });
  }
}
