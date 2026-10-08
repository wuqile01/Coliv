# CoLiv 数据库数据清单

> 数据库：Supabase PostgreSQL · 项目 `qgcfhkhxvvcxcvshight`（东京 ap-northeast-1）
> 快照时间：2026-10-08 18:55
> 总量：**42 行 / 19 张表**（其中 8 张表为空）

---

## 一、账号（User，4 条）

| 姓名 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| 张三 | zhang@test.com | `coliv1234` | 演示账号 · 朝阳合租房主 |
| 李四 | li@test.com | `coliv1234` | 演示账号 · 朝阳合租成员 |
| 王五 | wang@test.com | `coliv1234` | 演示账号 · 朝阳合租成员 |
| wuqile | 18267721013@163.com | 你自己设的 | **你注册的真实账号** |

密码不是明文存储。库里存的是 `scrypt$<salt>$<hash>` 格式，
即使用户表被拖走也无法反推出原始密码。

---

## 二、房屋（House，2 个）

| 房屋名 | 邀请码 | 房主 |
|--------|--------|------|
| 朝阳合租 | `COLIV001` | 张三 |
| 智学苑13号楼八单元101 | `C0F48E68` | wuqile（你） |

邀请码是室友加入的凭证 —— 别人在注册后输入这个码，就会成为该房屋成员。

---

## 三、成员关系（Member，4 条）

| 房屋 | 成员 | 角色 |
|------|------|------|
| 朝阳合租 | 张三 | **房主** |
| 朝阳合租 | 李四 | 成员 |
| 朝阳合租 | 王五 | 成员 |
| 智学苑13号楼八单元101 | wuqile（你） | **房主** |

房主比普通成员多两项权限：修改房屋设置、置顶/删除他人公告。

---

## 四、公共物品（SharedItem，3 条）

| 房屋 | 物品 | 金额 | 购买人 |
|------|------|------|--------|
| 朝阳合租 | 纸巾 | ¥45 | 王五 |
| 朝阳合租 | 洗洁精 | ¥25 | — |
| 朝阳合租 | 垃圾袋 | ¥12 | — |

---

## 五、水电费（UtilityBill，3 条 · 均为 2026-10）

| 房屋 | 类型 | 月份 | 总额 | 分摊方式 |
|------|------|------|------|---------|
| 朝阳合租 | 电费 | 2026-10 | ¥320 | 均摊 |
| 朝阳合租 | 水费 | 2026-10 | ¥180 | 均摊 |
| 朝阳合租 | 燃气费 | 2026-10 | ¥120 | 均摊 |

**合计 ¥620**，按 3 人均摊，每人应付 ¥206.67。

### 分摊明细（BillSplit，9 条）

| 成员 | 电费 | 水费 | 燃气费 | 小计 |
|------|------|------|--------|------|
| 张三 | ¥106.67 | ¥60 | ¥40 | **¥206.67** |
| 李四 | ¥106.67 | ¥60 | ¥40 | **¥206.67** |
| 王五 | ¥106.67 | ¥60 | ¥40 | **¥206.67** |

---

## 六、清洁分工（CleaningZone，4 条）

| 房屋 | 区域 | 频率 |
|------|------|------|
| 朝阳合租 | 厨房 | 每周 |
| 朝阳合租 | 卫生间 | 每周 |
| 朝阳合租 | 客厅 | 每周 |
| 朝阳合租 | 走廊 | 每日 |

> `CleaningAssignment`（轮值分配）有 4 条记录，
> `CleaningRotationOrder`、`CleaningTask` 为空 —— 说明轮值表尚未生成，
> 当前只有区域定义。

---

## 七、维修工单（RepairOrder，1 条）

| 房屋 | 标题 | 紧急度 | 状态 | 报修人 |
|------|------|--------|------|--------|
| 朝阳合租 | 卫生间水龙头漏水 | 🔴 紧急 | 已提交 | 李四 |

---

## 八、公告（Announcement，1 条）

**欢迎使用 CoLiv**（置顶）
> 大家好！从今天起用这个 App 管理合租生活 🎉

---

## 九、动态流水（ActivityFeed，7 条）

| 时间 | 操作人 | 动作 |
|------|--------|------|
| 10-08 09:26 | 张三 | 完成清洁（厨房）|
| 10-08 07:57 | 系统 | 修改房屋设置（账单日）|
| 10-08 07:56 | 系统 | 修改房屋设置（账单日）|
| 10-08 07:39 | 李四 | 成员离开 ⚠️ |
| 10-08 02:16 | 李四 | 完成清洁（卫生间）|
| 10-07 23:16 | 王五 | 购买物品（纸巾 ¥45）|
| 10-07 04:16 | 张三 | 记账（电费 ¥320）|

> ⚠️ `10-08 07:39 李四 成员离开` 是我清理测试数据时误产生的记录。
> 李四的成员记录已恢复（`leaveDate` 置回 NULL），但这条历史流水还在，
> 属于无害残留。

---

## 十、空表（8 张）

以下表结构已建好但暂无数据，属于正常 —— 对应功能还没用起来：

| 表名 | 用途 |
|------|------|
| `AbsentPeriod` | 外出/不在住期间（影响水电分摊） |
| `CleaningRotationOrder` | 清洁轮值顺序 |
| `CleaningTask` | 具体清洁任务实例 |
| `HouseRule` | 房屋公约 |
| `MonthlyBill` | 月度账单汇总 |
| `Notification` | 通知（Phase 10 已废弃）|
| `Settlement` | 结算记录 |
| `Visitor` | 访客登记 |

---

## 怎么自己看 Supabase 数据

### 方式一：网页控制台（推荐）

打开 [Supabase Table Editor](https://supabase.com/dashboard/project/qgcfhkhxvvcxcvshight/editor)

**⚠️ 第一个坑：schema 一定要选 `public`**

左上角的「模式 / Schema」下拉框，默认可能停在 **`auth`** —— 那是 Supabase 自带的
认证系统表（`users`、`identities`、`mfa_factors`…），**我们一个都没用到，所以是空的**。

我们的数据全在 **`public`** 里。切过去才能看到这 19 张表：

```
User  Member  House           ← 账号、成员、房屋
UtilityBill  BillSplit        ← 水电费 + 分摊明细
SharedItem                    ← 公共物品
CleaningZone  CleaningTask    ← 清洁分工
RepairOrder  Announcement     ← 维修、公告
ActivityFeed  Visitor  ...    ← 动态、访客
```

> 为什么会有两套？最初接的是 Supabase Auth，后来发现适配器配错了
> （provider 写成 sqlite），注册能过但读不到用户，就换成自建认证。
> auth 那套表就此闲置。**在用的只有 `public.User.passwordHash`。**

登录用你创建项目时的 Supabase 账号。如果记不清密码，用邮箱找回。

### 方式二：SQL Editor

同一个控制台里点 `SQL Editor`，随手查（SQL Editor 不受 schema 下拉影响）：

```sql
-- 看所有房屋
SELECT name, "inviteCode" FROM "House";

-- 看某人应付多少
SELECT u.name, SUM(bs.amount)
FROM "BillSplit" bs
JOIN "Member" m ON m.id = bs."memberId"
JOIN "User" u ON u.id = m."userId"
GROUP BY u.name;
```

### 方式三：让我查

直接跟我说「查一下水电费」之类，我连库读给你 —— 上面这份清单就是这么来的。

---

## ✅ 数据库密码已更新（2026-10-08）

原密码曾泄漏到 GitHub，现已重置。**首次重置时踩了坑，记录于此**：

**故障现象**：Supabase 改密码后，应用登录返回 `500`，所有涉及数据库的操作全部失败。
纯静态页面（如 `/signin`）仍返回 200 —— 这个对比能快速定位「是库的问题，不是代码的问题」。

**原因**：Supabase 密码**立即生效**，但 Railway 上的 `DATABASE_URL` 不会自动跟着变。
从改密码那一刻起，后端就连不上库了。

**正确顺序**：

1. 在 Supabase [Database Settings](https://supabase.com/dashboard/project/qgcfhkhxvvcxcvshight/settings/database) 重置密码
   —— **先把新密码复制下来再关弹窗**，关了就再也看不到了
2. **立刻**更新 Railway 的 `DATABASE_URL`
3. 密码里的特殊字符必须 **URL 转义**

**关于转义（最容易错的地方）**：

`@` 在 URL 里是「主机分隔符」。如果密码以 `@` 开头却直接写进连接串，
程序会在第一个 `@` 处切断，解析出错误的主机名。

| 密码本体 | URL 中的写法 |
|---------|------------|
| `@MyPass123` | `%40MyPass123` |

完整示例：

```
postgresql://postgres.<project-ref>:%40MyPass123@aws-0-<region>.pooler.supabase.com:5432/postgres?connection_limit=5
```

**改完自检**：

```bash
# 应用是否恢复
curl -X POST https://coliv-production-4b0c.up.railway.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"zhang@test.com","password":"coliv1234"}'
# 期望 200，不是 500
```

