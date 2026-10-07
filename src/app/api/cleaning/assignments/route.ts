import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths } from "date-fns";

const DEMO_HOUSE_NAME = "朝阳合租";

async function getDemoHouseId() {
  const h = await prisma.house.findFirst({ where: { name: DEMO_HOUSE_NAME } });
  return h?.id ?? null;
}

/** 根据频率计算下次到期日 */
function nextDueDate(from: Date, frequency: string): Date {
  switch (frequency) {
    case "daily":    return addDays(from, 1);
    case "biweekly": return addWeeks(from, 2);
    case "monthly":  return addMonths(from, 1);
    default:         return addWeeks(from, 1); // weekly
  }
}

/** GET /api/cleaning/assignments?houseId=&memberId=&status= */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const houseId = sp.get("houseId") ?? (await getDemoHouseId());
  const memberId = sp.get("memberId");
  const status = sp.get("status");

  if (!houseId) return NextResponse.json({ assignments: [] });

  const where: Record<string, unknown> = {
    zone: { houseId },
  };
  if (memberId) where.memberId = memberId;
  if (status) where.status = status;

  const assignments = await prisma.cleaningAssignment.findMany({
    where,
    include: {
      zone: true,
      member: { include: { user: { select: { name: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({ assignments });
}

/** POST /api/cleaning/assignments — 手动创建一次分配 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zoneId, memberId, dueDate } = body as { zoneId: string; memberId: string; dueDate: string };

    if (!zoneId || !memberId || !dueDate) {
      return NextResponse.json({ message: "zoneId、memberId、dueDate 必填" }, { status: 400 });
    }

    const assignment = await prisma.cleaningAssignment.create({
      data: {
        zoneId,
        memberId,
        dueDate: new Date(dueDate),
        status: "pending",
      },
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "创建分配失败" }, { status: 500 });
  }
}

/**
 * PUT /api/cleaning/assignments — 自动排班
 * 按轮值顺序给每个区域生成下一轮分配（若无未完成任务）
 */
export async function PUT(request: Request) {
  try {
    const { houseId: rawHouseId } = (await request.json().catch(() => ({}))) as { houseId?: string };
    const houseId = rawHouseId ?? (await getDemoHouseId());
    if (!houseId) return NextResponse.json({ message: "未找到房屋" }, { status: 404 });

    const zones = await prisma.cleaningZone.findMany({
      where: { houseId, isActive: true },
      include: {
        rotations: { orderBy: { orderIndex: "asc" } },
        assignments: {
          where: { status: { in: ["pending", "overdue"] } },
          orderBy: { dueDate: "desc" },
          take: 1,
        },
      },
    });

    const created: string[] = [];

    for (const zone of zones) {
      if (zone.rotations.length === 0) continue;
      // 如果还有未完成的任务，跳过
      if (zone.assignments.length > 0) continue;

      // 找到上次完成的任务，判断轮到谁
      const lastCompleted = await prisma.cleaningAssignment.findFirst({
        where: { zoneId: zone.id, status: "completed" },
        orderBy: { completedAt: "desc" },
      });

      let nextRotationIndex = 0;
      if (lastCompleted) {
        const lastIdx = zone.rotations.findIndex((r) => r.memberId === lastCompleted.memberId);
        nextRotationIndex = (lastIdx + 1) % zone.rotations.length;
      }

      const nextMemberId = zone.rotations[nextRotationIndex].memberId;
      const dueDate = nextDueDate(new Date(), zone.frequency);

      const a = await prisma.cleaningAssignment.create({
        data: { zoneId: zone.id, memberId: nextMemberId, dueDate, status: "pending" },
      });
      created.push(a.id);
    }

    return NextResponse.json({ created: created.length, ids: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "排班失败" }, { status: 500 });
  }
}
