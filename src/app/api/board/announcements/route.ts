import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const DEMO_HOUSE_NAME = "朝阳合租";

const announcementSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(50),
  content: z.string().trim().min(1, "内容不能为空").max(1000),
  isPinned: z.boolean().optional().default(false),
  expiresAt: z.string().datetime().optional(),
});

async function getDemoContext() {
  const house = await prisma.house.findFirst({ where: { name: DEMO_HOUSE_NAME } });
  if (!house) return null;
  const members = await prisma.member.findMany({ where: { houseId: house.id, leaveDate: null } });
  return { house, members };
}

export async function GET() {
  const ctx = await getDemoContext();
  if (!ctx) return NextResponse.json({ announcements: [] });

  const announcements = await prisma.announcement.findMany({
    where: { houseId: ctx.house.id },
    include: { author: { include: { user: { select: { name: true } } } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ctx = await getDemoContext();
    if (!ctx) return NextResponse.json({ message: "未找到房屋" }, { status: 404 });

    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "校验失败", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const authorId = body.authorId ?? ctx.members[0]?.id;
    if (!authorId) return NextResponse.json({ message: "未找到发布人" }, { status: 404 });

    const ann = await prisma.announcement.create({
      data: {
        houseId: ctx.house.id,
        authorId,
        title: parsed.data.title,
        content: parsed.data.content,
        isPinned: parsed.data.isPinned,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });
    return NextResponse.json({ announcement: ann }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "发布失败" }, { status: 500 });
  }
}
