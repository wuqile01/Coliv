import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_HOUSE_NAME = "朝阳合租";

async function getDemoMemberId() {
  const house = await prisma.house.findFirst({ where: { name: DEMO_HOUSE_NAME } });
  if (!house) return null;
  const member = await prisma.member.findFirst({ where: { houseId: house.id, leaveDate: null } });
  return member?.id ?? null;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ message: "工单不存在" }, { status: 404 });
    if (order.status !== "submitted") {
      return NextResponse.json({ message: `当前状态 ${order.status} 不可认领` }, { status: 409 });
    }

    const claimedById = await getDemoMemberId();
    const updated = await prisma.repairOrder.update({
      where: { id: orderId },
      data: { status: "claimed", claimedById },
    });
    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "操作失败" }, { status: 500 });
  }
}
