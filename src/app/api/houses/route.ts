import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHouseSchema } from "@/lib/validations/house";

const DEMO_USER_EMAIL = "zhang@test.com";

async function createUniqueInviteCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    const exists = await prisma.house.findUnique({ where: { inviteCode: code } });
    if (!exists) return code;
  }
  throw new Error("邀请码生成失败，请重试");
}

export async function GET() {
  const houses = await prisma.house.findMany({
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ houses });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createHouseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "表单校验失败", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 认证暂时跳过：Phase 2 接入后从 session 获取用户。
    const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
    if (!user) {
      return NextResponse.json(
        { message: "演示用户不存在，请先执行 npm run db:seed" },
        { status: 409 }
      );
    }

    const inviteCode = await createUniqueInviteCode();
    const data = parsed.data;

    const house = await prisma.$transaction(async (tx) => {
      const created = await tx.house.create({
        data: {
          name: data.name,
          address: data.address || null,
          roomCount: data.roomCount,
          billDay: data.billDay,
          cleaningCycle: data.cleaningCycle,
          defaultSplitMethod: data.defaultSplitMethod,
          inviteCode,
          createdById: user.id,
        },
      });

      await tx.member.create({
        data: {
          houseId: created.id,
          userId: user.id,
          role: "owner",
          joinDate: new Date(),
        },
      });

      return created;
    });

    return NextResponse.json({ house }, { status: 201 });
  } catch (error) {
    console.error("POST /api/houses failed", error);
    return NextResponse.json({ message: "创建房屋失败，请稍后重试" }, { status: 500 });
  }
}
