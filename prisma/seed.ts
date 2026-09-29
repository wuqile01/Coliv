import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase(); // 8位大写
}

async function main() {
  console.log("🌱 开始 seed...");

  // 清理旧数据
  await prisma.activityFeed.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.houseRule.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.monthlyBill.deleteMany();
  await prisma.billSplit.deleteMany();
  await prisma.repairOrder.deleteMany();
  await prisma.absentPeriod.deleteMany();
  await prisma.utilityBill.deleteMany();
  await prisma.sharedItem.deleteMany();
  await prisma.cleaningAssignment.deleteMany();
  await prisma.cleaningRotationOrder.deleteMany();
  await prisma.cleaningTask.deleteMany();
  await prisma.cleaningZone.deleteMany();
  await prisma.member.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();

  // 创建用户
  const [zhang, li, wang] = await Promise.all([
    prisma.user.create({ data: { email: "zhang@test.com", name: "张三" } }),
    prisma.user.create({ data: { email: "li@test.com", name: "李四" } }),
    prisma.user.create({ data: { email: "wang@test.com", name: "王五" } }),
  ]);

  // 创建房屋
  const house = await prisma.house.create({
    data: {
      name: "朝阳合租",
      address: "北京市朝阳区XX小区",
      roomCount: 3,
      billDay: 1,
      cleaningCycle: "weekly",
      inviteCode: generateInviteCode(),
      createdById: zhang.id,
    },
  });

  // 创建成员
  const [m1, m2, m3] = await Promise.all([
    prisma.member.create({
      data: {
        houseId: house.id,
        userId: zhang.id,
        roomNumber: "1",
        role: "owner",
        joinDate: new Date("2026-01-01"),
      },
    }),
    prisma.member.create({
      data: {
        houseId: house.id,
        userId: li.id,
        roomNumber: "2",
        role: "member",
        joinDate: new Date("2026-01-01"),
      },
    }),
    prisma.member.create({
      data: {
        houseId: house.id,
        userId: wang.id,
        roomNumber: "3",
        role: "member",
        joinDate: new Date("2026-03-01"),
      },
    }),
  ]);

  // 创建清洁区域
  const zones = await Promise.all([
    prisma.cleaningZone.create({
      data: {
        houseId: house.id,
        name: "厨房",
        icon: "ChefHat",
        difficultyWeight: 3,
        frequency: "weekly",
        sortOrder: 0,
        tasks: {
          create: [
            { name: "灶台擦拭" },
            { name: "油烟机清理" },
            { name: "地面拖洗" },
            { name: "水槽清洁" },
          ],
        },
      },
    }),
    prisma.cleaningZone.create({
      data: {
        houseId: house.id,
        name: "卫生间",
        icon: "Droplets",
        difficultyWeight: 3,
        frequency: "weekly",
        sortOrder: 1,
        tasks: {
          create: [{ name: "马桶清洁" }, { name: "洗手台" }, { name: "地面拖洗" }],
        },
      },
    }),
    prisma.cleaningZone.create({
      data: {
        houseId: house.id,
        name: "客厅",
        icon: "Sofa",
        difficultyWeight: 2,
        frequency: "weekly",
        sortOrder: 2,
        tasks: {
          create: [{ name: "地面清扫" }, { name: "桌面整理" }],
        },
      },
    }),
    prisma.cleaningZone.create({
      data: {
        houseId: house.id,
        name: "垃圾倾倒",
        icon: "Trash2",
        difficultyWeight: 1,
        frequency: "daily",
        sortOrder: 3,
      },
    }),
  ]);

  // 设置轮值顺序
  for (const zone of zones) {
    await Promise.all([
      prisma.cleaningRotationOrder.create({ data: { zoneId: zone.id, memberId: m1.id, orderIndex: 0 } }),
      prisma.cleaningRotationOrder.create({ data: { zoneId: zone.id, memberId: m2.id, orderIndex: 1 } }),
      prisma.cleaningRotationOrder.create({ data: { zoneId: zone.id, memberId: m3.id, orderIndex: 2 } }),
    ]);
  }

  // 创建本周清洁任务
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  await Promise.all([
    prisma.cleaningAssignment.create({ data: { zoneId: zones[0].id, memberId: m1.id, dueDate: today, status: "pending" } }),
    prisma.cleaningAssignment.create({ data: { zoneId: zones[1].id, memberId: m2.id, dueDate: tomorrow, status: "pending" } }),
    prisma.cleaningAssignment.create({ data: { zoneId: zones[2].id, memberId: m3.id, dueDate: yesterday, status: "overdue" } }),
    prisma.cleaningAssignment.create({ data: { zoneId: zones[3].id, memberId: m1.id, dueDate: yesterday, status: "overdue" } }),
  ]);

  // 本月水电费
  const period = "2026-09";
  const bill = await prisma.utilityBill.create({
    data: {
      houseId: house.id,
      type: "electric",
      period,
      mode: "amount",
      totalAmount: 320,
      splitMethod: "equal",
      recordedById: m1.id,
    },
  });

  const perPerson = 320 / 3;
  await Promise.all([
    prisma.billSplit.create({ data: { billId: bill.id, memberId: m1.id, amount: perPerson } }),
    prisma.billSplit.create({ data: { billId: bill.id, memberId: m2.id, amount: perPerson } }),
    prisma.billSplit.create({ data: { billId: bill.id, memberId: m3.id, amount: perPerson } }),
  ]);

  // 维修工单
  await prisma.repairOrder.create({
    data: {
      houseId: house.id,
      title: "卫生间水龙头漏水",
      description: "慢漏，需要换密封圈",
      urgency: "normal",
      status: "submitted",
      reportedById: m2.id,
    },
  });

  // 房屋守则
  await Promise.all([
    prisma.houseRule.create({ data: { houseId: house.id, ruleText: "安静时段 23:00-07:00", sortOrder: 0 } }),
    prisma.houseRule.create({ data: { houseId: house.id, ruleText: "厨房用完即清", sortOrder: 1 } }),
    prisma.houseRule.create({ data: { houseId: house.id, ruleText: "吸烟请去阳台", sortOrder: 2 } }),
  ]);

  console.log("✅ Seed 完成");
  console.log(`  房屋: ${house.name} (邀请码: ${house.inviteCode})`);
  console.log(`  成员: 张三(owner) 李四 王五`);
  console.log(`  清洁区域: ${zones.length} 个`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
