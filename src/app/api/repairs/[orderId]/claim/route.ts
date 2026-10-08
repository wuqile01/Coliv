import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentContext } from "@/lib/identity";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const ctx = await getCurrentContext();
    if (!ctx?.currentMember) {
      return NextResponse.json({ message: "未登录或未加入房屋" }, { status: 401 });
    }

    const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ message: "工单不存在" }, { status: 404 });
    if (order.houseId !== ctx.house.id) {
      return NextResponse.json({ message: "工单不属于你的房屋" }, { status: 403 });
    }
    if (order.status !== "submitted") {
      return NextResponse.json({ message: `当前状态 ${order.status} 不可认领` }, { status: 409 });
    }

    const updated = await prisma.repairOrder.update({
      where: { id: orderId },
      data: { status: "claimed", claimedById: ctx.currentMember.id },
    });
    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "操作失败" }, { status: 500 });
  }
}
