import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilityBillSchema } from "@/lib/validations/expenses";
import { computeSplit } from "@/lib/split";

const DEMO_HOUSE_NAME = "朝阳合租";

async function getDemoContext() {
  const house = await prisma.house.findFirst({ where: { name: DEMO_HOUSE_NAME } });
  if (!house) return null;
  const members = await prisma.member.findMany({
    where: { houseId: house.id, leaveDate: null },
    include: { user: { select: { name: true } } },
  });
  return { house, members };
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const period = sp.get("period");
  const ctx = await getDemoContext();
  if (!ctx) return NextResponse.json({ bills: [] });

  const bills = await prisma.utilityBill.findMany({
    where: { houseId: ctx.house.id, ...(period ? { period } : {}) },
    include: {
      recordedBy: { include: { user: { select: { name: true } } } },
      splits: { include: { member: { include: { user: { select: { name: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bills });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ctx = await getDemoContext();
    if (!ctx) return NextResponse.json({ message: "未找到房屋" }, { status: 404 });

    const parsed = utilityBillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "参数校验失败", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { house, members } = ctx;
    const data = parsed.data;
    const recordedById = body.recordedById ?? members[0]?.id;
    if (!recordedById) return NextResponse.json({ message: "未找到录入人" }, { status: 404 });

    // 读数模式自动计算金额
    let totalAmount = data.totalAmount;
    if (data.mode === "reading" && data.readingBefore != null && data.readingAfter != null && data.unitPrice != null) {
      totalAmount = Math.round((data.readingAfter - data.readingBefore) * data.unitPrice * 100) / 100;
    }

    // 重复录入检查
    const existing = await prisma.utilityBill.findUnique({
      where: { houseId_type_period: { houseId: house.id, type: data.type, period: data.period } },
    });
    if (existing) {
      return NextResponse.json({ message: `${data.period} ${data.type} 账单已录入，如需修改请先删除原记录` }, { status: 409 });
    }

    const memberIds = members.map((m) => m.id);
    const splitResults = computeSplit(totalAmount, "equal", memberIds);

    const bill = await prisma.$transaction(async (tx) => {
      const created = await tx.utilityBill.create({
        data: {
          houseId: house.id,
          type: data.type,
          period: data.period,
          mode: data.mode,
          totalAmount,
          readingBefore: data.readingBefore ?? null,
          readingAfter: data.readingAfter ?? null,
          unitPrice: data.unitPrice ?? null,
          splitMethod: data.splitMethod,
          recordedById,
        },
      });

      await tx.billSplit.createMany({
        data: splitResults.map((r) => ({
          billId: created.id,
          memberId: r.memberId,
          amount: r.amount,
        })),
      });

      await tx.activityFeed.create({
        data: {
          houseId: house.id,
          actorMemberId: recordedById,
          actionType: "bill_recorded",
          actionData: JSON.stringify({ type: data.type, period: data.period, totalAmount }),
        },
      });

      return created;
    });

    return NextResponse.json({ bill }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "录入失败，请稍后重试" }, { status: 500 });
  }
}
