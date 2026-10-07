import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleaningZoneSchema } from "@/lib/validations/cleaning";

const DEMO_HOUSE_ID_KEY = "朝阳合租";

async function getDemoHouseId() {
  const house = await prisma.house.findFirst({ where: { name: DEMO_HOUSE_ID_KEY } });
  return house?.id ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const houseId = searchParams.get("houseId");

  const id = houseId ?? (await getDemoHouseId());
  if (!id) return NextResponse.json({ zones: [] });

  const zones = await prisma.cleaningZone.findMany({
    where: { houseId: id },
    include: {
      tasks: { where: { isActive: true } },
      rotations: { include: { member: { include: { user: { select: { name: true } } } } }, orderBy: { orderIndex: "asc" } },
      _count: { select: { assignments: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ zones });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { houseId, ...rest } = body;

    const id = houseId ?? (await getDemoHouseId());
    if (!id) return NextResponse.json({ message: "未找到房屋" }, { status: 404 });

    const parsed = cleaningZoneSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "表单校验失败", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const zone = await prisma.cleaningZone.create({
      data: { ...parsed.data, houseId: id },
      include: { tasks: true },
    });

    return NextResponse.json({ zone }, { status: 201 });
  } catch (err) {
    console.error("POST /api/cleaning/zones failed", err);
    return NextResponse.json({ message: "创建失败，请稍后重试" }, { status: 500 });
  }
}
