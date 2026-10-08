import { prisma } from "@/lib/prisma";
import { RepairsClientPage } from "@/components/repairs/RepairsClientPage";

export default async function RepairsPage() {
  const house = await prisma.house.findFirst({ where: { name: "朝阳合租" } });
  if (!house) return <div className="p-4 text-muted-foreground">未找到房屋，请先运行 seed。</div>;

  // 两个查询互不依赖，并行执行省一次跨洋往返
  const [members, orders] = await Promise.all([
    prisma.member.findMany({
      where: { houseId: house.id, leaveDate: null },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.repairOrder.findMany({
      where: { houseId: house.id },
      include: {
        reportedBy: { include: { user: { select: { name: true } } } },
        claimedBy: { include: { user: { select: { name: true } } } },
      },
      orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const serialized = orders.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    urgency: o.urgency,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    resolvedAt: o.resolvedAt?.toISOString() ?? null,
    cost: o.cost,
    reportedByName: o.reportedBy.user.name,
    reportedById: o.reportedById,
    claimedByName: o.claimedBy?.user.name ?? null,
    claimedById: o.claimedById,
  }));

  return (
    <RepairsClientPage
      orders={serialized}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      houseId={house.id}
    />
  );
}
