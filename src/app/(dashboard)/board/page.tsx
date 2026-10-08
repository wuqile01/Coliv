import { prisma } from "@/lib/prisma";
import { BoardClientPage } from "@/components/board/BoardClientPage";

export default async function BoardPage() {
  const house = await prisma.house.findFirst({ where: { name: "朝阳合租" } });
  if (!house) return <div className="p-4 text-muted-foreground">未找到房屋，请先运行 seed。</div>;

  const members = await prisma.member.findMany({
    where: { houseId: house.id, leaveDate: null },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const [announcements, visitors] = await Promise.all([
    prisma.announcement.findMany({
      where: { houseId: house.id },
      include: { author: { include: { user: { select: { name: true } } } } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
    prisma.visitor.findMany({
      where: { houseId: house.id },
      include: { hostMember: { include: { user: { select: { name: true } } } } },
      orderBy: { visitDate: "desc" },
      take: 20,
    }),
  ]);

  type AnnWithAuthor = (typeof announcements)[number];
  const serializedAnn = announcements.map((a: AnnWithAuthor) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    isPinned: a.isPinned,
    authorName: a.author.user.name,
    authorId: a.authorId,
    createdAt: a.createdAt.toISOString(),
    expiresAt: a.expiresAt?.toISOString() ?? null,
  }));

  type VisitorWithHost = (typeof visitors)[number];
  const serializedVisitors = visitors.map((v: VisitorWithHost) => ({
    id: v.id,
    visitorName: v.visitorName,
    hostName: v.hostMember.user.name,
    hostMemberId: v.hostMemberId,
    visitDate: v.visitDate.toISOString(),
    overnight: v.isOvernight,
    note: v.notes,
  }));

  return (
    <BoardClientPage
      announcements={serializedAnn}
      visitors={serializedVisitors}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      houseId={house.id}
    />
  );
}
