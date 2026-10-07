import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleaningZoneSchema } from "@/lib/validations/cleaning";

export async function PATCH(request: Request, { params }: { params: Promise<{ zoneId: string }> }) {
  const { zoneId } = await params;
  try {
    const parsed = cleaningZoneSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "校验失败", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const zone = await prisma.cleaningZone.update({ where: { id: zoneId }, data: parsed.data });
    return NextResponse.json({ zone });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ zoneId: string }> }) {
  const { zoneId } = await params;
  try {
    await prisma.cleaningZone.update({ where: { id: zoneId }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "删除失败" }, { status: 500 });
  }
}
