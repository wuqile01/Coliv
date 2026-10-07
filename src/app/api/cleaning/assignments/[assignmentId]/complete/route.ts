import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params;
  try {
    const { photos = [] } = await request.json().catch(() => ({}));

    const assignment = await prisma.cleaningAssignment.findUnique({
      where: { id: assignmentId },
      include: { zone: true },
    });
    if (!assignment) return NextResponse.json({ message: "任务不存在" }, { status: 404 });

    const updated = await prisma.cleaningAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "completed",
        completedAt: new Date(),
        photos: JSON.stringify(photos),
      },
    });

    await prisma.activityFeed.create({
      data: {
        houseId: assignment.zone.houseId,
        actorMemberId: assignment.memberId,
        actionType: "cleaning_completed",
        actionData: JSON.stringify({ zoneName: assignment.zone.name }),
      },
    });

    return NextResponse.json({ assignment: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "操作失败" }, { status: 500 });
  }
}
