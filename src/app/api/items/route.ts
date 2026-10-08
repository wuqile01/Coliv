import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentContext } from "@/lib/identity";
import { sharedItemSchema } from "@/lib/validations/items";
import { computeSplit } from "@/lib/split";


export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const houseId = sp.get("houseId");
  const type = sp.get("type"); // consumable | durable

  const ctx = await getCurrentContext();
  if (!ctx) return NextResponse.json({ items: [] });
  const id = houseId ?? ctx.house.id;

  const items = await prisma.sharedItem.findMany({
    where: { houseId: id, ...(type ? { type } : {}) },
    include: {
      purchaser: { include: { user: { select: { name: true } } } },
      splits: true,
    },
    orderBy: { purchaseDate: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { houseId: rawHouseId, ...rest } = body;

    const ctx = await getCurrentContext();
    if (!ctx) return NextResponse.json({ message: "未找到房屋" }, { status: 404 });
    const houseId = rawHouseId ?? ctx.house.id;

    const parsed = sharedItemSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "参数校验失败", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const purchaserId = body.purchaserId ?? ctx.currentMember?.id;
    if (!purchaserId) return NextResponse.json({ message: "未找到采购人" }, { status: 404 });

    const memberIds = ctx.members.map((m) => m.id);
    const splitResults = computeSplit(parsed.data.price, "equal", memberIds, { purchaserId });

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.sharedItem.create({
        data: {
          houseId,
          purchaserId,
          type: parsed.data.type,
          name: parsed.data.name,
          price: parsed.data.price,
          purchaseDate: new Date(parsed.data.purchaseDate),
          photoUrl: parsed.data.photoUrl || null,
          ownership: parsed.data.ownership,
          splitMethod: parsed.data.splitMethod,
        },
      });

      await tx.billSplit.createMany({
        data: splitResults.map((r) => ({
          sharedItemId: created.id,
          memberId: r.memberId,
          amount: r.amount,
        })),
      });

      await tx.activityFeed.create({
        data: {
          houseId,
          actorMemberId: purchaserId,
          actionType: "item_purchased",
          actionData: JSON.stringify({ name: parsed.data.name, price: parsed.data.price }),
        },
      });

      return created;
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "登记失败" }, { status: 500 });
  }
}
