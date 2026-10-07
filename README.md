# CoLiv · 合租管家

> 让合租不再因为「谁该做什么」和「谁欠谁多少」而消耗关系。

一个面向合租人群的房屋管理 Web 应用，覆盖**清洁分工、公共物品登记、水电费分摊、维修报修、公告板**五大场景。

---

## ✨ 功能

| 模块 | 说明 |
|------|------|
| 🏠 **房屋管理** | 创建房屋、邀请码加入、成员管理、房间分配、退租处理 |
| ✨ **清洁分工** | 按区域自动排班轮值，逾期/今日/明日分组卡片，一键打卡，支持跳过 |
| 🛒 **公共物品** | 消耗品 / 耐用品分类，采购登记，低库存提醒，自动均摊 |
| 💳 **费用分摊** | 水电燃气账单录入（支持表读数或直接金额），均摊/按天数/自定义，**债务简化算法**（N 笔转账压缩到最少） |
| 🔧 **维修报修** | 提交工单、认领、完成流转，紧急程度标记，维修费用记录 |
| 📢 **公告板** | 公告发布与置顶，访客登记（含过夜标记） |
| 📊 **首页** | 本月账单概览、待处理事项聚合、动态时间线、快捷入口 |

---

## 🛠 技术栈

- **框架**：Next.js 15（App Router）+ React 19 + TypeScript 5.8
- **样式**：Tailwind CSS 3.4 + shadcn/ui（new-york 风格，绿色主色）
- **数据**：Prisma 5 ORM
  - 本地开发：SQLite
  - 生产部署：PostgreSQL（Supabase / Neon / Vercel Postgres）
- **状态**：Zustand + TanStack Query
- **校验**：Zod
- **认证**：Better Auth（代码就绪，默认演示模式跳过）
- **PWA**：原生 Web App Manifest + Service Worker（零依赖）

---

## 🚀 本地开发

```bash
# 安装依赖（如果 shell 里 NODE_ENV=production，需要 --include=dev）
npm install --include=dev

# 初始化数据库
npx prisma db push
npm run db:seed

# 启动
npm run dev
```

访问 http://localhost:3000

**演示数据**：用户 `zhang@test.com`，房屋「朝阳合租」，3 名成员。

---

## ☁️ 部署到 Vercel

### 1. 准备 PostgreSQL 数据库

Vercel 无持久磁盘，**必须用 Postgres**。免费方案：

- [Supabase](https://supabase.com) — 500MB 免费额度
- [Neon](https://neon.tech) — 500MB 免费额度
- Vercel Postgres

拿到连接串后，修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"   // 从 sqlite 改为 postgresql
  url      = env("DATABASE_URL")
}
```

### 2. 推送到 GitHub

```bash
git push -u origin main
```

### 3. 在 Vercel 导入项目

1. 打开 [vercel.com/new](https://vercel.com/new)
2. 选择 `Coliv` 仓库
3. Framework Preset 会自动识别为 Next.js
4. 添加环境变量：
   ```
   DATABASE_URL=postgresql://...
   ```
5. 点击 Deploy

### 4. 初始化生产数据库

部署完成后，在本地用生产连接串执行：

```bash
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npm run db:seed
```

---

## 📁 目录结构

```
src/
├── app/
│   ├── (auth)/              # 登录 / 注册
│   ├── (dashboard)/         # 主应用（含共享布局）
│   │   ├── page.tsx         # 首页 Dashboard
│   │   ├── cleaning/        # 清洁分工
│   │   ├── expenses/        # 费用分摊
│   │   ├── repairs/         # 维修报修
│   │   ├── items/           # 公共物品
│   │   ├── board/           # 公告板
│   │   └── houses/          # 房屋管理
│   └── api/                 # Route Handlers
├── components/
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── shared/              # Navigation / TopHeader / EmptyState
│   └── {模块}/              # 各模块客户端组件
├── lib/
│   ├── prisma.ts            # Prisma 单例
│   ├── split.ts             # 分摊与债务简化算法
│   ├── urgency.ts           # 紧急度分组
│   └── validations/         # Zod schema
└── stores/                  # Zustand
prisma/
├── schema.prisma            # 18 张表
└── seed.ts                  # 演示数据
```

---

## 🧮 核心算法

**债务简化**（`src/lib/split.ts`）——把多人互欠的复杂关系压缩成最少笔数的转账：

```
净余额 = 已付 - 应付
债权人按金额降序，债务人按金额降序，贪心匹配抵消
```

3 人互相欠 6 笔 → 压缩为 2 笔。

---

## 📄 文档

- `docs/PRD.md` — 产品需求文档
- `docs/DESIGN.md` — UI/UX 设计规范
- `docs/ARCHITECTURE.md` — 技术架构与 API 清单
- `TODO.md` — 开发进度追踪

---

## 📌 已知限制

- 认证模块（Better Auth）代码就绪但未启用，当前为演示模式（固定房屋「朝阳合租」）
- 实时推送未实现（原 Phase 10 通知系统已按需求舍弃）
- 本地构建在低内存容器中可能 OOM，Vercel 构建不受影响
