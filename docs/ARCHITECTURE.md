# CoLiv 技术方案文档

> 日期：2026-09-26  
> 关联文档：CoLiv_PRD.md  

---

## 1. 技术栈确认

### 1.1 前端

| 项 | 选型 | 理由 |
|----|------|------|
| 框架 | **Next.js 15 (App Router)** | React 生态最成熟的全栈框架，SSR/SSG/PWA 均支持 |
| 语言 | **TypeScript** | 类型安全，vibecoding 友好，AI 生成准确率高 |
| 样式 | **Tailwind CSS 4** | 原子化 CSS，与 shadcn/ui 原生配合 |
| UI 组件 | **shadcn/ui** | 复制粘贴式组件，可定制无锁定，参考 spliit 同款 |
| 状态管理 | **Zustand** | 轻量，无 Provider 嵌套，适合中小型应用 |
| 数据请求 | **TanStack Query (React Query v5)** | 服务端状态管理，缓存/乐观更新/轮询 |
| 表单 | **React Hook Form + Zod** | 类型安全的表单校验，与 shadcn/ui Form 组件深度集成 |
| 图表 | **Recharts** | 月度账单可视化、公平性看板 |
| 图标 | **Lucide React** | shadcn/ui 默认图标库 |
| 日期处理 | **date-fns** | 轻量，tree-shakeable，替代 moment |
| PWA | **next-pwa** | 离线支持，可安装到手机主屏 |

### 1.2 后端 & 数据层

| 项 | 选型 | 理由 |
|----|------|------|
| BaaS | **Supabase** | Auth + PostgreSQL + Storage + Realtime 一套搞定，零后端代码 |
| 数据库 | **PostgreSQL (Supabase 内置)** | 关系型，支持 RLS 行级安全，分摊计算需要关系查询 |
| ORM | **Prisma 5** | 类型安全，迁移管理规范，社区生态好，spliit 同款 |
| 认证 | **Supabase Auth** | 手机号/邮箱/微信 OAuth，JWT 自带 |
| 文件存储 | **Supabase Storage** | 清洁照片、维修照片、小票图片 |
| 实时推送 | **Supabase Realtime (WebSocket)** | 清洁打卡、维修工单状态变更实时同步 |

### 1.3 部署 & 工具

| 项 | 选型 | 理由 |
|----|------|------|
| 托管 | **Vercel** | Next.js 原生支持，免费起步，Edge Functions 可用 |
| 代码仓库 | **GitHub** | 标准选择 |
| 错误监控 | **Sentry** | 免费额度够用 |
| 分析 | **Vercel Analytics** | 轻量，无第三方脚本 |

### 1.4 架构图

```
┌──────────────────────────────────────────────┐
│              Next.js 15 (Vercel)              │
│                                               │
│  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │
│  │ App     │  │ Server  │  │ Route        │  │
│  │ Router   │  │ Actions │  │ Handlers     │  │
│  │ (Pages)  │  │ ( mutations│ (API Routes) │  │
│  └────┬─────┘  └────┬────┘  └──────┬───────┘  │
│       │              │              │          │
│       └──────────────┴──────────────┘          │
│                      │                         │
│              ┌───────┴────────┐                │
│              │  TanStack Query│                │
│              │  (客户端缓存)   │                │
│              └───────┬────────┘                │
└──────────────────────┼────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │       Supabase Cloud          │
        │                               │
        │  ┌────────┐  ┌────────────┐  │
        │  │  Auth   │  │ PostgreSQL  │  │
        │  │ (JWT)   │  │  (Prisma)   │  │
        │  └────────┘  └──────┬─────┘  │
        │                      │        │
        │  ┌────────────┐  ┌───┴──────┐ │
        │  │  Storage   │  │ Realtime  │ │
        │  │ (照片/小票)  │  │ (WebSocket)│ │
        │  └────────────┘  └──────────┘ │
        └──────────────────────────────┘
```

### 1.5 目录结构

```
coliv/
├── prisma/
│   ├── schema.prisma          # 数据模型定义
│   └── migrations/             # 迁移文件
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 登录/注册页
│   │   ├── (dashboard)/       # 主功能页
│   │   │   ├── page.tsx        # 首页 Dashboard
│   │   │   ├── cleaning/       # 清洁模块
│   │   │   ├── items/          # 公共物品
│   │   │   ├── expenses/       # 费用分摊
│   │   │   ├── repairs/        # 维修报修
│   │   │   └── board/          # 公告板
│   │   ├── api/                # API Routes
│   │   └── layout.tsx          # 根布局
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件
│   │   ├── cleaning/           # 清洁模块组件
│   │   ├── expenses/           # 费用组件
│   │   ├── repairs/            # 维修组件
│   │   └── shared/             # 共享组件
│   ├── lib/
│   │   ├── supabase/           # Supabase 客户端
│   │   ├── prisma.ts           # Prisma 客户端
│   │   ├── utils.ts            # 工具函数
│   │   └── calculations.ts     # 分摊计算逻辑
│   ├── stores/                 # Zustand stores
│   │   ├── houseStore.ts       # 当前房屋状态
│   │   └── userStore.ts        # 用户状态
│   ├── hooks/                  # 自定义 Hooks
│   └── types/                  # TypeScript 类型定义
├── public/
│   └── manifest.json           # PWA 配置
├── .env.local                  # 环境变量
└── package.json
```
# CoLiv 数据库设计

> 日期：2026-09-26  
> 数据库：PostgreSQL (Supabase)  
> ORM：Prisma 5  

---

## 1. ER 关系总览

```
User ──< Member >── House
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   CleaningZone    SharedItem     RepairOrder
        │               │               │
   CleaningRecord   UtilityBill    Settlement
        │               │               │
        └─────── MonthlyBill ───────────┘
                   Announcement
                   Visitor
                   AbsentPeriod
```

---

## 2. 完整表结构

### 2.1 用户 & 房屋

#### `users` — 用户

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | |
| email | varchar(255) | UNIQUE, NOT NULL | 登录邮箱 |
| phone | varchar(20) | UNIQUE, NULL | 手机号（可选登录方式） |
| name | varchar(50) | NOT NULL | 昵称 |
| avatar_url | text | NULL | 头像 URL |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

#### `houses` — 房屋

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| name | varchar(100) | NOT NULL | 房屋名称，如"朝阳合租" |
| address | varchar(255) | NULL | 地址（选填） |
| room_count | int | default 3 | 房间数 |
| bill_day | int | default 1, CHECK(1-28) | 每月账单日 |
| cleaning_cycle | enum('weekly','biweekly','monthly') | default 'weekly' | 清洁周期 |
| default_split_method | enum('equal','by_room','by_head','custom') | default 'equal' | 默认分摊方式 |
| invite_code | varchar(8) | UNIQUE | 邀请码 |
| created_by | uuid | FK → users.id | 创建人 |
| created_at | timestamptz | default now() | |

#### `members` — 房屋成员

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, ON DELETE CASCADE | |
| user_id | uuid | FK → users.id | |
| room_number | varchar(10) | NULL | 入住房间号 |
| role | enum('owner','admin','member') | default 'member' | owner=房主, admin=管理员 |
| join_date | date | NOT NULL | 入住日期 |
| leave_date | date | NULL | 退租日期（NULL=当前在住） |
| created_at | timestamptz | default now() | |

**索引：** UNIQUE(house_id, user_id) — 防止重复加入  
**索引：** INDEX(house_id, leave_date) — 查询当前在住成员

---

### 2.2 清洁模块

#### `cleaning_zones` — 清洁区域

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| name | varchar(50) | NOT NULL | 区域名：厨房/卫生间/客厅 |
| icon | varchar(50) | NULL | 图标名（lucide icon） |
| difficulty_weight | int | default 1, CHECK(1-5) | 难度权重，用于公平性校验 |
| frequency | enum('daily','weekly','biweekly','monthly') | default 'weekly' | 清洁频率 |
| is_active | boolean | default true | 是否启用 |
| sort_order | int | default 0 | 排序 |
| created_at | timestamptz | default now() | |

#### `cleaning_tasks` — 清洁子任务

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| zone_id | uuid | FK → cleaning_zones.id, CASCADE | |
| name | varchar(100) | NOT NULL | 子任务名：灶台擦拭/地面 |
| is_active | boolean | default true | |

#### `cleaning_assignments` — 轮值排班

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| zone_id | uuid | FK → cleaning_zones.id, CASCADE | |
| member_id | uuid | FK → members.id | 当前负责人 |
| due_date | date | NOT NULL | 截止日期 |
| status | enum('pending','completed','overdue','skipped') | default 'pending' | |
| assigned_at | timestamptz | default now() | 分配时间 |
| completed_at | timestamptz | NULL | 完成时间 |
| photos | text[] | NULL | 打卡照片 URL 数组 |
| confirmed_by | uuid[] | NULL | 确认人 member_id 数组 |
| skip_reason | text | NULL | 跳过原因 |

**索引：** INDEX(zone_id, due_date) — 按区域+日期查询  
**索引：** INDEX(member_id, status) — 查"我的任务"

#### `cleaning_rotation_order` — 轮值顺序

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| zone_id | uuid | FK → cleaning_zones.id, CASCADE | |
| member_id | uuid | FK → members.id | |
| order_index | int | NOT NULL | 顺序（0, 1, 2...） |

**索引：** UNIQUE(zone_id, member_id)

---

### 2.3 公共物品模块

#### `shared_items` — 公共物品

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| type | enum('consumable','durable') | NOT NULL | 消耗品/耐用品 |
| name | varchar(100) | NOT NULL | 物品名 |
| purchaser_id | uuid | FK → members.id | 购买人 |
| price | decimal(10,2) | NOT NULL | 价格 |
| purchase_date | date | NOT NULL | 购买日期 |
| photo_url | text | NULL | 物品照片/小票 |
| ownership | enum('shared','personal') | default 'shared' | 归属：公用/个人 |
| split_method | enum('equal','by_room','purchaser_only','custom') | default 'equal' | 分摊方式 |
| low_stock | boolean | default false | 低库存标记 |
| created_at | timestamptz | default now() | |

**索引：** INDEX(house_id, type) — 按类型筛选

---

### 2.4 费用分摊模块

#### `utility_bills` — 水电燃气账单

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| type | enum('electric','water','gas','internet','property','other') | NOT NULL | 费用类型 |
| period | varchar(7) | NOT NULL | 账期，格式 "2026-09" |
| mode | enum('reading','amount') | NOT NULL | 读数模式/金额模式 |
| reading_before | decimal(12,2) | NULL | 上次读数 |
| reading_after | decimal(12,2) | NULL | 本次读数 |
| unit_price | decimal(10,4) | NULL | 单价 |
| total_amount | decimal(10,2) | NOT NULL | 总金额 |
| photo_url | text | NULL | 表盘照片 |
| split_method | enum('equal','by_room','by_days','custom') | default 'equal' | 分摊方式 |
| recorded_by | uuid | FK → members.id | 录入人 |
| created_at | timestamptz | default now() | |

**索引：** UNIQUE(house_id, type, period) — 防止重复录入

#### `bill_splits` — 费用分摊明细

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| bill_id | uuid | FK → utility_bills.id, CASCADE | 关联账单（NULL=独立费用） |
| shared_item_id | uuid | FK → shared_items.id, CASCADE | 关联公共物品（NULL） |
| repair_order_id | uuid | FK → repair_orders.id, CASCADE | 关联维修（NULL） |
| member_id | uuid | FK → members.id | 承担人 |
| amount | decimal(10,2) | NOT NULL | 应付金额 |
| days_present | int | NULL | 在场天数（by_days 模式） |
| is_exempt | boolean | default false | 是否豁免 |
| created_at | timestamptz | default now() | |

**说明：** bill_id / shared_item_id / repair_order_id 三选一，表示这笔分摊来源于哪种费用。

#### `absent_periods` — 不在场记录

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| member_id | uuid | FK → members.id, CASCADE | |
| start_date | date | NOT NULL | 不在场开始日期 |
| end_date | date | NOT NULL | 不在场结束日期 |
| reason | varchar(100) | NULL | 原因（出差/旅行） |
| created_at | timestamptz | default now() | |

**索引：** INDEX(member_id, start_date, end_date)

---

### 2.5 维修模块

#### `repair_orders` — 维修工单

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| title | varchar(200) | NOT NULL | 问题描述（简） |
| description | text | NULL | 详细描述 |
| photos | text[] | NULL | 照片 URL 数组 |
| urgency | enum('urgent','normal') | default 'normal' | 紧急程度 |
| status | enum('submitted','claimed','in_progress','completed','settled') | default 'submitted' | |
| reported_by | uuid | FK → members.id | 报修人 |
| claimed_by | uuid | FK → members.id, NULL | 认领人 |
| resolved_at | timestamptz | NULL | 解决时间 |
| resolved_photos | text[] | NULL | 修复后照片 |
| cost | decimal(10,2) | NULL | 维修费用 |
| cost_split_method | enum('equal','by_room','reporter_only','custom') | default 'equal' | 费用分摊方式 |
| related_item_id | uuid | FK → shared_items.id, NULL | 关联耐用品 |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

**索引：** INDEX(house_id, status) — 按状态筛选

---

### 2.6 结算模块

#### `settlements` — 结算记录

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| from_member_id | uuid | FK → members.id | 付款人 |
| to_member_id | uuid | FK → members.id | 收款人 |
| amount | decimal(10,2) | NOT NULL | 金额 |
| period | varchar(7) | NOT NULL | 账期 "2026-09" |
| status | enum('pending','paid','confirmed') | default 'pending' | |
| paid_at | timestamptz | NULL | 标记付款时间 |
| confirmed_at | timestamptz | NULL | 收款人确认时间 |
| created_at | timestamptz | default now() | |

**索引：** INDEX(house_id, period, status)

#### `monthly_bills` — 月度账单汇总

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| period | varchar(7) | NOT NULL | 账期 "2026-09" |
| total_amount | decimal(10,2) | NOT NULL | 总金额 |
| member_summary | jsonb | NOT NULL | 每人分项明细 JSON |
| status | enum('draft','published','settled') | default 'draft' | |
| published_at | timestamptz | NULL | 发布时间 |
| created_at | timestamptz | default now() | |

**索引：** UNIQUE(house_id, period)  
**member_summary 示例：**
```json
{
  "members": [
    {
      "member_id": "uuid-1",
      "name": "张三",
      "items": [
        {"category": "electric", "amount": 120.50},
        {"category": "shared_item", "amount": 15.00, "item_name": "纸巾"},
        {"category": "repair", "amount": 50.00, "item_name": "水管维修"}
      ],
      "total": 185.50
    }
  ]
}
```

---

### 2.7 公告板模块

#### `announcements` — 公告

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| author_id | uuid | FK → members.id | |
| title | varchar(200) | NOT NULL | |
| content | text | NOT NULL | |
| is_pinned | boolean | default false | 是否置顶 |
| expires_at | timestamptz | NULL | 过期时间 |
| created_at | timestamptz | default now() | |

#### `visitors` — 访客登记

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| visitor_name | varchar(50) | NOT NULL | 来访人 |
| host_member_id | uuid | FK → members.id | 接待人 |
| visit_date | date | NOT NULL | 来访日期 |
| is_overnight | boolean | default false | 是否过夜 |
| notes | text | NULL | 备注 |
| created_at | timestamptz | default now() | |

#### `house_rules` — 房屋守则

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| rule_text | varchar(500) | NOT NULL | 守则内容 |
| sort_order | int | default 0 | 排序 |
| created_at | timestamptz | default now() | |

---

### 2.8 通知 & 活动

#### `notifications` — 通知

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| target_member_id | uuid | FK → members.id, NULL | 目标人（NULL=全员） |
| type | varchar(50) | NOT NULL | cleaning_due / expense_recorded / repair_submitted / bill_published / settlement_request |
| title | varchar(200) | NOT NULL | |
| body | text | NULL | |
| link | varchar(255) | NULL | 点击跳转路径 |
| is_read | boolean | default false | |
| created_at | timestamptz | default now() | |

**索引：** INDEX(target_member_id, is_read)

#### `activity_feed` — 动态流

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | |
| house_id | uuid | FK → houses.id, CASCADE | |
| actor_member_id | uuid | FK → members.id, NULL | 执行人 |
| action_type | varchar(50) | NOT NULL | cleaning_completed / item_purchased / bill_recorded / repair_submitted / repair_completed / absent_marked / member_joined / member_left |
| action_data | jsonb | NULL | 附加数据 |
| created_at | timestamptz | default now() | |

**索引：** INDEX(house_id, created_at DESC) — 按时间倒序查询
# CoLiv API 接口清单

> 日期：2026-09-26  
> 架构：Next.js Server Actions + Route Handlers  
> 认证：Supabase Auth (JWT)  

---

## 1. 认证模块

| # | 方法 | 路径 | 说明 | 请求体 | 响应 |
|---|------|------|------|--------|------|
| A1 | POST | `/api/auth/signup` | 邮箱注册 | `{email, password, name}` | `{user, session}` |
| A2 | POST | `/api/auth/signin` | 邮箱登录 | `{email, password}` | `{user, session}` |
| A3 | POST | `/api/auth/signout` | 退出登录 | — | `{success}` |
| A4 | POST | `/api/auth/phone-send` | 发送手机验证码 | `{phone}` | `{success}` |
| A5 | POST | `/api/auth/phone-verify` | 验证码登录 | `{phone, code}` | `{user, session}` |
| A6 | GET | `/api/auth/me` | 获取当前用户 | — | `{user}` |

---

## 2. 房屋管理模块

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| H1 | POST | `/api/houses` | 创建房屋 | `{name, address?, room_count?, bill_day?, cleaning_cycle?}` | `{house, invite_code}` |
| H2 | GET | `/api/houses/:houseId` | 获取房屋详情 | `houseId` | `{house, members}` |
| H3 | PATCH | `/api/houses/:houseId` | 更新房屋设置 | `{name?, bill_day?, cleaning_cycle?, default_split_method?}` | `{house}` |
| H4 | DELETE | `/api/houses/:houseId` | 删除房屋（仅 owner） | — | `{success}` |
| H5 | POST | `/api/houses/join` | 通过邀请码加入 | `{invite_code, room_number?}` | `{house, member}` |
| H6 | GET | `/api/houses/:houseId/members` | 成员列表 | `houseId` | `{members: []}` |
| H7 | PATCH | `/api/houses/:houseId/members/:memberId` | 更新成员（角色/房间） | `{role?, room_number?}` | `{member}` |
| H8 | POST | `/api/houses/:houseId/members/:memberId/leave` | 成员退租 | `{leave_date}` | `{settlement_summary}` |
| H9 | POST | `/api/houses/:houseId/regenerate-invite` | 重新生成邀请码 | — | `{invite_code}` |

---

## 3. 清洁模块

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| C1 | GET | `/api/houses/:houseId/cleaning/zones` | 区域列表（含子任务） | `houseId` | `{zones: []}` |
| C2 | POST | `/api/houses/:houseId/cleaning/zones` | 创建清洁区域 | `{name, icon?, difficulty_weight?, frequency?}` | `{zone}` |
| C3 | PATCH | `/api/cleaning/zones/:zoneId` | 更新区域 | `{name?, difficulty_weight?, frequency?, is_active?}` | `{zone}` |
| C4 | DELETE | `/api/cleaning/zones/:zoneId` | 删除区域 | — | `{success}` |
| C5 | POST | `/api/cleaning/zones/:zoneId/tasks` | 添加子任务 | `{name}` | `{task}` |
| C6 | DELETE | `/api/cleaning/tasks/:taskId` | 删除子任务 | — | `{success}` |
| C7 | GET | `/api/houses/:houseId/cleaning/assignments` | 轮值列表 | `?status=&from=&to=` | `{assignments: []}` |
| C8 | GET | `/api/houses/:houseId/cleaning/my-tasks` | 我的待办任务 | — | `{assignments: []}` |
| C9 | POST | `/api/cleaning/assignments/:assignmentId/complete` | 打卡完成 | `{photos: []}` | `{assignment}` |
| C10 | POST | `/api/cleaning/assignments/:assignmentId/confirm` | 确认他人完成 | — | `{assignment}` |
| C11 | POST | `/api/cleaning/assignments/:assignmentId/skip` | 跳过（标记未做） | `{skip_reason}` | `{assignment}` |
| C12 | POST | `/api/cleaning/assignments/:assignmentId/swap` | 发起换班请求 | `{target_member_id}` | `{swap_request}` |
| C13 | POST | `/api/cleaning/swaps/:swapId/accept` | 接受换班 | — | `{assignment}` |
| C14 | POST | `/api/cleaning/swaps/:swapId/decline` | 拒绝换班 | — | `{swap_request}` |
| C15 | GET | `/api/houses/:houseId/cleaning/stats` | 公平性看板 | `?period=` | `{members: [{member_id, name, completed_count, total_weight, on_time_rate}]}` |
| C16 | GET | `/api/cleaning/zones/:zoneId/rotation` | 获取轮值顺序 | — | `{order: []}` |
| C17 | PATCH | `/api/cleaning/zones/:zoneId/rotation` | 更新轮值顺序 | `{member_ids: []}` | `{order}` |

---

## 4. 公共物品模块

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| I1 | GET | `/api/houses/:houseId/items` | 物品列表 | `?type=consumable\|durable` | `{items: []}` |
| I2 | POST | `/api/houses/:houseId/items` | 登记物品 | `{type, name, price, purchase_date, photo_url?, ownership?, split_method?}` | `{item, splits: []}` |
| I3 | PATCH | `/api/items/:itemId` | 更新物品 | `{name?, price?, low_stock?}` | `{item}` |
| I4 | DELETE | `/api/items/:itemId` | 删除物品 | — | `{success}` |
| I5 | PATCH | `/api/items/:itemId/low-stock` | 标记低库存 | `{low_stock: bool}` | `{item}` |

---

## 5. 费用分摊模块

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| E1 | GET | `/api/houses/:houseId/bills` | 账单列表 | `?type=&period=` | `{bills: []}` |
| E2 | POST | `/api/houses/:houseId/bills` | 录入水电账单 | `{type, period, mode, reading_before?, reading_after?, unit_price?, total_amount, photo_url?, split_method}` | `{bill, splits: []}` |
| E3 | PATCH | `/api/bills/:billId` | 更新账单 | `{total_amount?, split_method?}` | `{bill, splits: []}` |
| E4 | DELETE | `/api/bills/:billId` | 删除账单 | — | `{success}` |
| E5 | GET | `/api/houses/:houseId/absent-periods` | 不在场记录列表 | `?member_id=` | `{periods: []}` |
| E6 | POST | `/api/houses/:houseId/absent-periods` | 标记不在场 | `{start_date, end_date, reason?}` | `{period}` |
| E7 | DELETE | `/api/absent-periods/:periodId` | 删除不在场记录 | — | `{success}` |

---

## 6. 维修模块

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| R1 | GET | `/api/houses/:houseId/repairs` | 工单列表 | `?status=` | `{repairs: []}` |
| R2 | POST | `/api/houses/:houseId/repairs` | 提交维修工单 | `{title, description?, photos: [], urgency?, related_item_id?}` | `{repair}` |
| R3 | PATCH | `/api/repairs/:repairId/claim` | 认领工单 | — | `{repair}` |
| R4 | PATCH | `/api/repairs/:repairId/progress` | 标记处理中 | — | `{repair}` |
| R5 | PATCH | `/api/repairs/:repairId/complete` | 标记已完成 | `{resolved_photos: [], cost?, cost_split_method?}` | `{repair, splits: []}` |
| R6 | PATCH | `/api/repairs/:repairId` | 更新工单 | `{title?, description?, urgency?}` | `{repair}` |
| R7 | DELETE | `/api/repairs/:repairId` | 删除工单（仅提交人） | — | `{success}` |

---

## 7. 结算模块

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| S1 | GET | `/api/houses/:houseId/monthly-bills` | 月度账单列表 | `?period=` | `{bills: []}` |
| S2 | GET | `/api/houses/:houseId/monthly-bills/:period` | 指定月份账单详情 | — | `{bill, breakdown}` |
| S3 | POST | `/api/houses/:houseId/monthly-bills/:period/generate` | 生成月度账单 | — | `{bill}` |
| S4 | POST | `/api/houses/:houseId/monthly-bills/:period/publish` | 发布账单（通知全员） | — | `{bill}` |
| S5 | GET | `/api/houses/:houseId/settlements` | 结算台账 | `?period=&status=` | `{settlements: [], optimized_routes: []}` |
| S6 | POST | `/api/settlements/:settlementId/pay` | 标记已转账 | — | `{settlement}` |
| S7 | POST | `/api/settlements/:settlementId/confirm` | 收款人确认收到 | — | `{settlement}` |
| S8 | GET | `/api/houses/:houseId/settlements/optimize` | 最优结算路径 | `?period=` | `{routes: [{from, to, amount}]}` |

---

## 8. 公告板模块

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| B1 | GET | `/api/houses/:houseId/announcements` | 公告列表 | `?pinned_only=` | `{announcements: []}` |
| B2 | POST | `/api/houses/:houseId/announcements` | 发布公告 | `{title, content, is_pinned?, expires_at?}` | `{announcement}` |
| B3 | PATCH | `/api/announcements/:annId` | 更新公告 | `{title?, content?, is_pinned?, expires_at?}` | `{announcement}` |
| B4 | DELETE | `/api/announcements/:annId` | 删除公告 | — | `{success}` |
| B5 | GET | `/api/houses/:houseId/visitors` | 访客列表 | — | `{visitors: []}` |
| B6 | POST | `/api/houses/:houseId/visitors` | 登记访客 | `{visitor_name, visit_date, is_overnight?, notes?}` | `{visitor}` |
| B7 | DELETE | `/api/visitors/:visitorId` | 删除访客记录 | — | `{success}` |
| B8 | GET | `/api/houses/:houseId/rules` | 房屋守则列表 | — | `{rules: []}` |
| B9 | POST | `/api/houses/:houseId/rules` | 添加守则 | `{rule_text, sort_order?}` | `{rule}` |
| B10 | DELETE | `/api/rules/:ruleId` | 删除守则 | — | `{success}` |

---

## 9. 通知 & 动态

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| N1 | GET | `/api/houses/:houseId/notifications` | 通知列表 | `?unread_only=true` | `{notifications: []}` |
| N2 | PATCH | `/api/notifications/:notifId/read` | 标记已读 | — | `{notification}` |
| N3 | POST | `/api/houses/:houseId/notifications/read-all` | 全部标记已读 | — | `{success}` |
| N4 | GET | `/api/houses/:houseId/feed` | 动态流 | `?limit=20&cursor=` | `{feed: [], next_cursor}` |

---

## 10. 文件上传

| # | 方法 | 路径 | 说明 | 请求体 | 响应 |
|---|------|------|------|--------|------|
| F1 | POST | `/api/upload` | 上传图片 | `multipart/form-data: {file, type}` | `{url}` |

`type` 枚举：`cleaning_photo` / `repair_photo` / `receipt` / `item_photo` / `meter_photo`  
文件大小限制：5MB，自动压缩  
允许格式：jpg, png, webp

---

## 11. 统计 & 导出

| # | 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|---|------|------|------|------------|------|
| X1 | GET | `/api/houses/:houseId/stats` | 房屋统计概览 | `?period=` | `{total_expense, cleaning_completion_rate, repair_count, per_member: []}` |
| X2 | GET | `/api/houses/:houseId/export` | 导出账单 CSV | `?period=&format=csv` | `CSV file` |
