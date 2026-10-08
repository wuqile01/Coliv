import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentContext } from "@/lib/identity";

const visitorSchema = z.object({
  hostMemberId: z.string().cuid(),
  visitorName: z.string().trim().min(1).max(30),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overnight: z.boolean().optional().default(false),
  note: z.string().trim().max(200).optional().default(""),
});


export async function GET() {
  const ctx = await getCurrentContext();
  if (!ctx) return NextResponse.json({ visitors: [] });

  const visitors = await prisma.visitor.findMany({
    where: { houseId: ctx.house.id },
    include: { hostMember: { include: { user: { select: { name: true } } } } },
    orderBy: { visitDate: "desc" },
    take: 30,
  });
  return NextResponse.json({ visitors });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ctx = await getCurrentContext();
    if (!ctx) return NextResponse.json({ message: "未找到房屋" }, { status: 404 });

    const parsed = visitorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "校验失败", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const log = await prisma.visitor.create({
      data: {
        houseId: ctx.house.id,
        hostMemberId: parsed.data.hostMemberId,
        visitorName: parsed.data.visitorName,
        visitDate: new Date(parsed.data.visitDate),
        isOvernight: parsed.data.overnight,
        notes: parsed.data.note,
      },
    });
    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "登记失败" }, { status: 500 });
  }
}
