import { prisma } from "@/lib/prisma";
import { ItemsClientPage } from "@/components/items/ItemsClientPage";

export default async function ItemsPage() {
  const house = await prisma.house.findFirst({ where: { name: "朝阳合租" } });
  if (!house) return <div className="p-4 text-muted-foreground">未找到房屋，请先运行 seed。</div>;

  // 两个查询互不依赖，并行执行省一次跨洋往返
  const [members, items] = await Promise.all([
    prisma.member.findMany({
      where: { houseId: house.id, leaveDate: null },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sharedItem.findMany({
      where: { houseId: house.id },
      include: {
        purchaser: { include: { user: { select: { name: true } } } },
        splits: { include: { member: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: { purchaseDate: "desc" },
      take: 50,
    }),
  ]);

  const serialized = items.map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    price: item.price,
    purchaseDate: item.purchaseDate.toISOString(),
    photoUrl: item.photoUrl,
    ownership: item.ownership,
    splitMethod: item.splitMethod,
    lowStock: item.lowStock,
    purchaserName: item.purchaser.user.name,
    purchaserId: item.purchaserId,
    splits: item.splits.map((s) => ({
      memberId: s.memberId,
      memberName: s.member.user.name,
      amount: s.amount,
    })),
  }));

  return (
    <ItemsClientPage
      items={serialized}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      houseId={house.id}
    />
  );
}
