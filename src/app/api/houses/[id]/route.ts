import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateHouseSchema = z.object({
  name: z.string().trim().min(2, "房屋名称至少 2 个字").max(30, "房屋名称最多 30 个字").optional(),
  address: z.string().trim().max(100, "地址最多 100 个字").optional(),
  roomCount: z.coerce.number().int().min(1, "至少 1 个房间").max(20, "最多 20 个房间").optional(),
  billDay: z.coerce.number().int().min(1, "账单日最早为 1 日").max(28, "账单日最晚为 28 日").optional(),
  cleaningCycle: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  defaultSplitMethod: z.enum(["equal", "by_room", "by_head", "custom"]).optional(),
});

async function getHouse(id: string) {
  return prisma.house.findUnique({ where: { id } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const house = await getHouse(id);
  if (!house) return NextResponse.json({ message: "房屋不存在" }, { status: 404 });
  return NextResponse.json({ house });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const house = await getHouse(id);
    if (!house) return NextResponse.json({ message: "房屋不存在" }, { status: 404 });

    const parsed = updateHouseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "表单校验失败", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 房间数不能小于当前在住成员数
    if (parsed.data.roomCount !== undefined) {
      const activeMembers = await prisma.member.count({
        where: { houseId: id, leaveDate: null },
      });
      if (parsed.data.roomCount < activeMembers) {
        return NextResponse.json(
          { message: `房间数不能少于当前在住成员数（${activeMembers} 人）` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.house.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.activityFeed.create({
      data: {
        houseId: id,
        actionType: "house_updated",
        actionData: JSON.stringify({ fields: Object.keys(parsed.data) }),
      },
    });

    return NextResponse.json({ house: updated });
  } catch (error) {
    console.error("PATCH /api/houses/[id] failed", error);
    return NextResponse.json({ message: "更新房屋失败，请稍后重试" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.house.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/houses/[id] failed", error);
    return NextResponse.json({ message: "删除房屋失败" }, { status: 500 });
  }
}
