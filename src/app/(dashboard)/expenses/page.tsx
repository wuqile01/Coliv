import { prisma } from "@/lib/prisma";
import { computeOptimalSettlement } from "@/lib/split";
import { ExpensesClientPage } from "@/components/expenses/ExpensesClientPage";

const BILL_TYPE_LABELS: Record<string, string> = {
  electric: "电费", water: "水费", gas: "燃气费",
  internet: "宽带费", property: "物业费", other: "其他",
};
const BILL_TYPE_ICONS: Record<string, string> = {
  electric: "⚡", water: "💧", gas: "🔥", internet: "📶", property: "🏠", other: "📋",
};

export default async function ExpensesPage() {
  const house = await prisma.house.findFirst({ where: { name: "朝阳合租" } });
  if (!house) return <div className="p-4 text-muted-foreground">未找到房屋，请先运行 seed。</div>;

  const members = await prisma.member.findMany({
    where: { houseId: house.id, leaveDate: null },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  const bills = await prisma.utilityBill.findMany({
    where: { houseId: house.id, period: currentPeriod },
    include: {
      recordedBy: { include: { user: { select: { name: true } } } },
      splits: { include: { member: { include: { user: { select: { name: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 计算每人净余额（应付 - 已付）
  const memberNet: Record<string, number> = {};
  for (const m of members) memberNet[m.id] = 0;

  for (const bill of bills) {
    for (const split of bill.splits) {
      memberNet[split.memberId] = (memberNet[split.memberId] ?? 0) - split.amount;
    }
  }

  const settlementRoutes = computeOptimalSettlement(
    Object.entries(memberNet).map(([memberId, net]) => ({ memberId, net }))
  );

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.user.name]));

  const serializedBills = bills.map((b) => ({
    id: b.id,
    type: b.type,
    typeLabel: BILL_TYPE_LABELS[b.type] ?? b.type,
    typeIcon: BILL_TYPE_ICONS[b.type] ?? "📋",
    period: b.period,
    totalAmount: b.totalAmount,
    splitMethod: b.splitMethod,
    recordedByName: b.recordedBy.user.name,
    splits: b.splits.map((s) => ({
      memberId: s.memberId,
      memberName: s.member.user.name,
      amount: s.amount,
    })),
  }));

  return (
    <ExpensesClientPage
      bills={serializedBills}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      memberNet={memberNet}
      settlementRoutes={settlementRoutes.map((r) => ({
        ...r,
        fromName: memberMap[r.fromMemberId] ?? r.fromMemberId,
        toName: memberMap[r.toMemberId] ?? r.toMemberId,
      }))}
      currentPeriod={currentPeriod}
      houseId={house.id}
    />
  );
}
