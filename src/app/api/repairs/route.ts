import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentContext } from "@/lib/identity";

const createRepairSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(50),
  description: z.string().trim().max(500).optional().default(""),
  urgency: z.enum(["urgent", "normal"]).optional().default("normal"),
  relatedItemId: z.string().cuid().optional(),
});


export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const status = sp.get("status");
  const ctx = await getCurrentContext();
  if (!ctx) return NextResponse.json({ orders: [] });

  const orders = await prisma.repairOrder.findMany({
    where: { houseId: ctx.house.id, ...(status ? { status } : {}) },
    include: {
      reportedBy: { include: { user: { select: { name: true } } } },
      claimedBy: { include: { user: { select: { name: true } } } },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ctx = await getCurrentContext();
    if (!ctx) return NextResponse.json({ message: "未找到房屋" }, { status: 404 });

    const parsed = createRepairSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "参数校验失败", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const reportedById = body.reportedById ?? ctx.members[0]?.id;
    if (!reportedById) return NextResponse.json({ message: "未找到报修人" }, { status: 404 });

    const order = await prisma.repairOrder.create({
      data: {
        houseId: ctx.house.id,
        title: parsed.data.title,
        description: parsed.data.description,
        urgency: parsed.data.urgency,
        status: "submitted",
        reportedById,
        relatedItemId: parsed.data.relatedItemId ?? null,
      },
    });

    await prisma.activityFeed.create({
      data: {
        houseId: ctx.house.id,
        actorMemberId: reportedById,
        actionType: "repair_submitted",
        actionData: JSON.stringify({ title: parsed.data.title }),
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "报修失败，请稍后重试" }, { status: 500 });
  }
}
