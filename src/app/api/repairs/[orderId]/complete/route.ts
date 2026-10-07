import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const { photos = [], cost } = await request.json().catch(() => ({}));

    const order = await prisma.repairOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) return NextResponse.json({ message: "工单不存在" }, { status: 404 });

    const updated = await prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status: "completed",
        resolvedAt: new Date(),
        resolvedPhotos: JSON.stringify(photos),
        cost: cost ?? null,
      },
    });

    await prisma.activityFeed.create({
      data: {
        houseId: order.houseId,
        actorMemberId: order.claimedById ?? order.reportedById,
        actionType: "repair_completed",
        actionData: JSON.stringify({ title: order.title }),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "操作失败" }, { status: 500 });
  }
}
