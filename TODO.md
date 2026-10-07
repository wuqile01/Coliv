# CoLiv 开发任务清单 (TODO.md)

> 生成日期：2026-09-29
> 来源文档：docs/PRD.md、docs/DESIGN.md、docs/ARCHITECTURE.md
> 工作流：单任务循环——一次只做一个 TODO，完成→测试→通过→git commit→下一个
> 崩溃处理：`git reset --hard` 回退到上一个 commit，不纠结，重来

---

## 状态图例

- `[ ]` 未开始
- `[~]` 进行中
- `[x]` 已完成

---

## Phase 0：项目初始化

- [x] 0.1 初始化 Next.js 15 + TypeScript + Tailwind 项目骨架
- [x] 0.2 安装 shadcn/ui，配置基础主题
- [x] 0.3 初始化 git 仓库，首次 commit
- [x] 0.4 配置 Prisma，连接数据库（本地先用 SQLite 占位可跑通）
- [x] 0.5 配置 ESLint + Prettier
- [x] 0.6 搭建目录结构（按 ARCHITECTURE.md 的目录设计）

## Phase 1：数据层（对应 ARCHITECTURE.md 数据库设计）

- [x] 1.1 编写 Prisma schema：users, houses, members
- [x] 1.2 编写 Prisma schema：cleaning_zones, cleaning_tasks, cleaning_assignments, cleaning_rotation_order
- [x] 1.3 编写 Prisma schema：shared_items
- [x] 1.4 编写 Prisma schema：utility_bills, bill_splits, absent_periods
- [x] 1.5 编写 Prisma schema：repair_orders
- [x] 1.6 编写 Prisma schema：settlements, monthly_bills
- [x] 1.7 编写 Prisma schema：announcements, visitors, house_rules
- [x] 1.8 编写 Prisma schema：notifications, activity_feed
- [x] 1.9 跑通首次 migration，生成本地数据库
- [x] 1.10 编写 seed 脚本（造测试数据：1个房屋+3个成员+若干任务）

## Phase 2：认证模块（对应 PRD.md 4.1 + ARCHITECTURE.md API清单 A1-A6）

- [ ] 2.1 集成 Supabase Auth，配置邮箱登录
- [ ] 2.2 实现注册页 `/signup`
- [ ] 2.3 实现登录页 `/signin`
- [ ] 2.4 实现认证中间件（保护 dashboard 路由）
- [ ] 2.5 实现个人中心基础页面（头像/昵称展示）

## Phase 3：房屋管理模块（对应 PRD.md 4.1 + API H1-H9）

- [x] 3.1 实现创建房屋页面 + API
- [x] 3.2 实现邀请码生成 + 二维码展示
- [x] 3.3 实现加入房屋流程（扫码/邀请码）
- [x] 3.4 实现成员列表页面
- [x] 3.5 实现房屋设置页面（账单日/清洁周期/分摊方式）
- [x] 3.6 实现成员退租流程

## Phase 4：清洁模块（对应 PRD.md 4.2 + DESIGN.md 3.0-3.4 + API C1-C17）

- [~] 4.1 实现清洁区域管理页面（CRUD）
- [ ] 4.2 实现「3.0 通用分组卡片列表」组件（可复用组件，先做这个）
- [ ] 4.3 实现「我的任务」Tab（套用 4.2 组件）
- [ ] 4.4 实现打卡页面（拍照上传 + 提交）
- [ ] 4.5 实现确认打卡功能（他人点赞确认）
- [ ] 4.6 实现跳过任务流程
- [ ] 4.7 实现换班请求流程
- [ ] 4.8 实现公平性看板 Tab
- [ ] 4.9 实现清洁轮值自动排班逻辑（到期自动切换下一负责人）
- [ ] 4.10 实现清洁到期提醒（前一天推送）

## Phase 5：公共物品模块（对应 PRD.md 4.3 + API I1-I5）

- [ ] 5.1 实现物品列表页面（消耗品/耐用品 Tab）
- [ ] 5.2 实现快速记账 Sheet（登记采购）
- [ ] 5.3 实现耐用品登记表单
- [ ] 5.4 实现低库存标记与提醒

## Phase 6：费用分摊模块（对应 PRD.md 4.4 + API E1-E7, S1-S8）

- [ ] 6.1 实现分摊计算核心逻辑（均分/按比例/按在场天数）—— 纯函数，先写单元测试
- [ ] 6.2 实现费用录入页面（读数模式/金额模式切换）
- [ ] 6.3 实现不在场标记功能
- [ ] 6.4 实现费用管理首页（本月账单预览）
- [ ] 6.5 实现结算台账 + 最优结算路径算法（债务简化）
- [ ] 6.6 实现月度账单生成与发布
- [ ] 6.7 实现月度账单详情页
- [ ] 6.8 实现标记已转账/确认收款流程
- [ ] 6.9 实现账单 CSV 导出

## Phase 7：维修模块（对应 PRD.md 4.5 + DESIGN.md 6.0-6.4 + API R1-R7）

- [ ] 7.1 实现维修工单列表（套用 4.2 通用组件，按状态分组）
- [ ] 7.2 实现报修 Sheet（提交工单）
- [ ] 7.3 实现工单详情页
- [ ] 7.4 实现工单状态流转（认领→处理中→完成）
- [ ] 7.5 实现维修费用登记与自动分摊

## Phase 8：公告板模块（对应 PRD.md 4.6 + API B1-B10）

- [x] 8.1 实现公告列表 + 发布功能（支持置顶、过期时间）
- [x] 8.2 实现访客登记功能（过夜标记、备注、登记人）

## Phase 9：首页 Dashboard（对应 PRD.md 4.7 + DESIGN.md 第2章）

- [x] 9.1 实现本月账单预览卡片（真实 UtilityBill 数据）
- [x] 9.2 实现待处理事项列表（聚合清洁逾期/维修/低库存，可点击跳转）
- [x] 9.3 实现最近动态时间线（activity_feed 真实数据 + actionType 映射）
- [x] 9.4 实现快捷入口按钮（Link 跳转）
- [x] 9.5 实现底部 Tab Bar + 响应式导航

## ~~Phase 10：通知系统~~（用户决定舍弃，不实现）

## Phase 11：PWA & 收尾

- [ ] 11.1 配置 next-pwa，支持离线安装
- [x] 11.2 全局空状态组件（src/components/shared/EmptyState.tsx，已接入 4 个页面）
- [ ] 11.3 响应式适配（移动优先，扩展到 tablet/desktop）
- [ ] 11.4 部署到 Vercel，连接生产 Supabase

---

## 当前进度

**当前任务：Phase 11 收尾（Phase 10 通知系统已按用户决定舍弃）**

**已完成：**
- Phase 0 项目初始化
- Phase 1 数据层（18 张表 + seed）
- Phase 2 认证模块（Better Auth 代码就绪，待接入）
- Phase 3 房屋管理
- Phase 4 清洁模块
- Phase 5 公共物品
- Phase 6 费用分摊
- Phase 7 维修模块
- Phase 8 公告板
- Phase 9 Dashboard 真实数据接入
- Phase 11.2 空状态组件

**剩余：** 11.1 PWA / 11.3 响应式微调 / 11.4 Vercel 部署

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-09-29 | 初始生成，共 11 个 Phase，60 个任务项 |
| 2026-09-29 | 完成 Phase 0、Phase 1 全部；SQLite+seed 跑通；响应式网站布局与 Dashboard 完成 |
| 2026-10-07 | 完成 Phase 3 房屋管理（创建/邀请码/加入/成员/设置/退租） |
