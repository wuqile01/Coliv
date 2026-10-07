import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params;
  try {
    const { reason = "" } = await request.json().catch(() => ({}));

    const assignment = await prisma.cleaningAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return NextResponse.json({ message: "任务不存在" }, { status: 404 });

    const updated = await prisma.cleaningAssignment.update({
      where: { id: assignmentId },
      data: { status: "skipped", skipReason: reason },
    });

    return NextResponse.json({ assignment: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "操作失败" }, { status: 500 });
  }
}
