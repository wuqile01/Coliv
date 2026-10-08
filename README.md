# CoLiv · 合租管家

> 让合租不再因为「谁该做什么」和「谁欠谁多少」而消耗关系。

一个面向合租人群的房屋管理 Web 应用，覆盖**清洁分工、公共物品登记、水电费分摊、维修报修、公告板**五大场景。

## 🔗 线上地址

**[https://coliv-production-4b0c.up.railway.app](https://coliv-production-4b0c.up.railway.app/)**

| 入口 | 说明 |
|------|------|
| [注册](https://coliv-production-4b0c.up.railway.app/signup) | 新用户创建账号 |
| [登录](https://coliv-production-4b0c.up.railway.app/signin) | 已有账号登录 |

**演示账号**（密码统一 `coliv1234`）：

| 邮箱 | 姓名 | 角色 |
|------|------|------|
| `zhang@test.com` | 张三 | 房主 |
| `li@test.com` | 李四 | 成员 |
| `wang@test.com` | 王五 | 成员 |

> 用张三登录能修改房屋设置；用李四登录那个入口是隐藏的 —— 权限差异一眼可见。

---

## ✨ 功能

| 模块 | 说明 |
|------|------|
| 🏠 **房屋管理** | 创建房屋、邀请码加入、成员管理、房间分配、退租处理 |
| ✨ **清洁分工** | 按区域自动排班轮值，逾期/今日/明日分组卡片，一键打卡，支持跳过 |
| 🛒 **公共物品** | 消耗品 / 耐用品分类，采购登记，低库存提醒，自动均摊 |
| 💳 **费用分摊** | 水电燃气账单录入（支持表读数或直接金额），均摊/按天数/自定义，**债务简化算法**（N 笔转账压缩到最少） |
| 🔧 **维修报修** | 提交工单、认领、完成流转，紧急程度标记，维修费用记录 |
| 📢 **公告板** | 公告发布、编辑、删除、置顶/取消置顶；访客登记（含过夜标记） |
| 📊 **首页** | 本月账单概览、待处理事项聚合、动态时间线、快捷入口 |
| 👤 **账号** | 邮箱+密码注册登录、个人资料、退出登录 |

### 公告板权限模型

公告操作是**两级权限**，不是简单的「作者专属」或「房主专属」：

| 操作 | 作者本人 | 房主 | 其他成员 |
|------|:-------:|:----:|:-------:|
| 编辑标题/内容 | ✅ | ❌ | ❌ |
| 置顶 / 取消置顶 | ✅ | ✅ | ❌ |
| 删除 | ✅ | ✅ | ❌ |

**编辑严格限作者**，因为内容被篡改比被删除更隐蔽 —— 删除至少留下"东西没了"的痕迹，
而悄悄改掉别人发的通知很难被发现。删除与置顶属于管理动作，房主需要能清理过期通知。

---

## 🛠 技术栈

- **框架**：Next.js 15（App Router）+ React 19 + TypeScript 5.8
- **样式**：Tailwind CSS 3.4 + shadcn/ui（new-york 风格，绿色主色）
- **数据**：Prisma 5 ORM + PostgreSQL（Supabase 托管）
- **状态**：Zustand + TanStack Query
- **校验**：Zod
- **认证**：**自建轻量认证**（`node:crypto` scrypt + HMAC 签名 Cookie，零第三方依赖）
- **部署**：Railway
- **PWA**：原生 Web App Manifest + Service Worker（零依赖）

---

## 🔐 认证实现

不依赖任何认证库，用 Node 内置 `node:crypto` 实现：

| 关注点 | 方案 |
|--------|------|
| 密码存储 | scrypt（N=16384, r=8, p=1, dklen=64），格式 `scrypt$<salt>$<hash>` |
| 密码校验 | `timingSafeEqual` 恒定时间比对，防时序攻击 |
| 会话 | 无状态 token `<userId>.<过期时间>.<HMAC-SHA256>`，30 天有效 |
| Cookie | `coliv_session`，httpOnly + sameSite=lax + 生产环境 secure |
| 限流 | 登录/注册各 10 次/分钟/IP（进程内固定窗口） |
| 防枚举 | 登录失败统一提示「邮箱或密码不正确」，不暴露邮箱是否存在 |

**Edge / Node 边界**（重要，改代码前必读）：

中间件跑在 Edge Runtime，`process.env` 会被**构建时内联**，且**不支持 `node:crypto` 的 scrypt**。因此：

- `src/lib/session-shared.ts` —— 零依赖，只放常量与「外形校验」（三段式 + 未过期），中间件只引用它
- `src/lib/auth-core.ts` —— 含 `node:crypto`，仅供 Node Runtime
- 中间件只做粗筛，**真正的验签与用户校验在 dashboard layout（Node）完成**

这条边界一旦打破，会出现「登录成功却被弹回登录页」的死循环，
且 `tsc --noEmit` 无法发现 —— 必须靠真实 `next build` 验证。

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

> 本地默认用 SQLite（`prisma/schema.prisma` 的 datasource），无需网络即可开发。
> 切换到 PostgreSQL 只需改 datasource 的 provider。

---

## ☁️ 部署（Railway）

线上跑在 [Railway](https://railway.com)，从本仓库 `main` 分支自动部署。

**需要的环境变量**：

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `AUTH_SECRET` | ✅ 生产必填 | 会话签名密钥；缺失时用默认值并告警 |
| `NEXT_PUBLIC_APP_URL` | 建议 | 应用对外地址 |

**构建命令**：

```bash
npm install --include=dev && prisma generate && next build --no-lint
```

### ⚠️ 更换数据库密码的正确姿势

Supabase 改密码是**立即生效**的，但 Railway 上的连接串不会自动跟着变。
顺序错了会导致整个应用 500（连不上库）：

1. 在 Supabase 重置数据库密码
2. **立刻**更新 Railway 的 `DATABASE_URL`
3. 密码里的特殊字符必须 URL 转义（`@` → `%40`）

示例（密码 `@MyPass123` 需转义为 `%40MyPass123`）：

```
postgresql://postgres.<project-ref>:%40MyPass123@aws-0-<region>.pooler.supabase.com:5432/postgres?connection_limit=5
```

> 连接串用 `5432`（Session 模式，支持 prepared statement）。
> 误配 `6543`（Transaction 模式）会导致查询失败 —— `src/lib/prisma.ts` 会自动纠正。

---

## 📁 目录结构

```
src/
├── app/
│   ├── (auth)/              # 登录 / 注册
│   ├── (dashboard)/         # 主应用（含共享布局）
│   │   ├── page.tsx         # 首页 Dashboard
│   │   ├── onboarding/      # 新用户引导（建房 or 加入）
│   │   ├── cleaning/        # 清洁分工
│   │   ├── expenses/        # 费用分摊
│   │   ├── repairs/         # 维修报修
│   │   ├── items/           # 公共物品
│   │   ├── board/           # 公告板
│   │   └── houses/          # 房屋管理
│   ├── api/                 # Route Handlers
│   │   ├── auth/            # signup / signin / signout
│   │   └── board/           # 公告、访客
│   └── ...
├── components/
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── shared/              # Navigation / TopHeader / EmptyState
│   └── {模块}/              # 各模块客户端组件
├── lib/
│   ├── auth-core.ts         # scrypt 哈希 + HMAC 会话（仅 Node）
│   ├── session-shared.ts    # Edge 安全的常量与外形校验
│   ├── identity.ts          # 身份解析 / 权限校验
│   ├── rate-limit.ts        # 限流
│   ├── prisma.ts            # Prisma 单例
│   ├── split.ts             # 分摊与债务简化算法
│   └── urgency.ts           # 紧急度分组
├── middleware.ts            # Edge：未登录跳转
└── stores/                  # Zustand
prisma/
├── schema.prisma            # 19 张表
└── seed.ts                  # 演示数据
tests/
└── announcement-permissions.mjs   # 公告权限逻辑测试
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

| 文档 | 内容 |
|------|------|
| `docs/PRD.md` | 产品需求文档 |
| `docs/DESIGN.md` | UI/UX 设计规范 |
| `docs/ARCHITECTURE.md` | 技术架构、API 清单、认证与权限模型 |
| `docs/DATA_SNAPSHOT.md` | 数据库数据清单、查看方式、改密码流程 |
| `TODO.md` | 开发进度追踪 |

---

## ✅ 测试

```bash
# 公告权限逻辑（14 项）
node tests/announcement-permissions.mjs

# 类型检查
node_modules/.bin/tsc --noEmit

# 构建（本仓库在低内存容器中可能 OOM，Railway 构建不受影响）
npx next build --no-lint
```

---

## 📌 已知限制

- **限流是进程内的**：多实例部署下各实例独立计数，应换 Redis
- **无邮箱验证、无找回密码**
- **头像以 base64 存库**（上限 600KB），生产应改为对象存储
- 实时推送未实现（原 Phase 10 通知系统已按需求舍弃）
- 本地构建在低内存容器中可能 OOM；编译阶段可通过，卡在「Generating static pages」
