# CoLiv 部署指南

> 目标：把 CoLiv 部署到 Vercel，使用 Supabase PostgreSQL 作为生产数据库。

---

## 前置条件

- GitHub 账号（代码已推送到 `wuqile01/Coliv`）
- Vercel 账号（可用 GitHub 登录）
- Supabase 账号（免费）

---

## 步骤 1：创建 Supabase 数据库

1. 打开 [supabase.com](https://supabase.com) → 用 GitHub 登录
2. 点击 **New project**
   - Name：`coliv`
   - Database Password：**自己设一个强密码，务必记下来**
   - Region：选 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`（离国内近）
3. 等待 2 分钟左右，项目创建完成
4. 进入 **Project Settings → Database → Connection string → URI**
5. 复制连接串，形如：

```
postgresql://postgres.abcdefgh:你的密码@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

⚠️ **重要**：如果连接串里密码含特殊字符（`@`、`#`、`%` 等），需要用 URL 编码。

---

## 步骤 2：初始化数据库表

在本地项目目录执行（把连接串换成你自己的）：

```bash
cd coliv

# 建表（18 张表）
DATABASE_URL="postgresql://..." npx prisma db push

# 灌入演示数据（用户 / 房屋 / 3 名成员 / 清洁区域等）
DATABASE_URL="postgresql://..." npm run db:seed
```

看到 `✔ Your database is now in sync` 和 seed 完成输出即成功。

---

## 步骤 3：部署到 Vercel

1. 打开 [vercel.com/new](https://vercel.com/new)
2. 用 GitHub 登录，选择 `Coliv` 仓库 → **Import**
3. 配置（大部分会自动识别）：
   - **Framework Preset**：Next.js（自动）
   - **Build Command**：`prisma generate && next build`（vercel.json 已配）
   - **Environment Variables**：添加一条
     | Name | Value |
     |------|-------|
     | `DATABASE_URL` | 步骤 1 复制的 Supabase 连接串 |
4. 点击 **Deploy**
5. 等待 1-2 分钟，构建成功后拿到域名，形如 `coliv-xxx.vercel.app`

---

## 步骤 4：验证

打开部署好的域名，逐项检查：

- [ ] 首页显示「朝阳合租」和本月账单概览
- [ ] 清洁页显示逾期/今日/明日分组任务
- [ ] 费用页能录入一条电费账单，成员余额随之变化
- [ ] 维修页能提交报修工单
- [ ] 物品页能登记采购
- [ ] 公告板能发布公告、登记访客
- [ ] 手机浏览器打开，底部 Tab Bar 正常显示
- [ ] 手机浏览器「添加到主屏幕」，能以 App 形式打开（PWA）

---

## 常见问题

### 构建失败：`PrismaClientInitializationError`

构建期尝试连接数据库失败。已通过 `export const dynamic = "force-dynamic"` 规避，若仍出现，检查 `DATABASE_URL` 是否正确配置在 Vercel 环境变量里。

### 构建失败：`Prisma Client not generated`

`package.json` 的 `build` 脚本已包含 `prisma generate`，且配置了 `postinstall`。若仍失败，确认 Vercel 的 Build Command 未被手动覆盖。

### 部署后页面空白 / 报错 `Cannot find module '.prisma/client/default'`

在 Vercel 项目设置的 Build & Development Settings 里，确认 Install Command 为默认的 `npm install`（不要加 `--production`，否则 devDependencies 不装）。

### 数据库连接超时

Supabase 免费版有连接数限制。如果使用连接池（端口 6543），确保连接串末尾带 `?pgbouncer=true`；如果使用直连（端口 5432），确保 `?sslmode=require`。

### 想重置生产数据

```bash
DATABASE_URL="postgresql://..." npx prisma db push --force-reset
DATABASE_URL="postgresql://..." npm run db:seed
```

---

## 后续可做

- **启用认证**：Better Auth 代码已在 `src/app/(auth)/` 就绪，接上后即可多房屋、多用户隔离
- **自定义域名**：Vercel 项目 → Settings → Domains
- **数据库迁移到 Migrate 工作流**：当前用 `db push`，正式项目建议改用 `prisma migrate deploy` + CI
