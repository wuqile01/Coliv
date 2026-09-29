# CoLiv 文档索引

## Docs（云文档）

| 文档 | 链接 |
|------|------|
| PRD 产品需求文档 | [CoLiv 合租管家 - PRD 产品需求文档](https://docs.corp.kuaishou.com/d/home/fcAAms1oSf08979U-sB4rkkoh) |
| DESIGN UI/UX 设计文档 | [CoLiv 合租管家 - DESIGN UI/UX 设计文档](https://docs.corp.kuaishou.com/d/home/fcAD-4Y7TjkWvLn7uyQEtQF81) |
| ARCHITECTURE 技术架构文档 | [CoLiv 合租管家 - ARCHITECTURE 技术架构文档](https://docs.corp.kuaishou.com/d/home/fcABhr7ErxhaCAmbndnmyW70c) |
| TODO 开发任务清单 | [CoLiv 合租管家 - TODO 开发任务清单](https://docs.corp.kuaishou.com/d/home/fcADkc5jBJTTYcaOtjY5I0OGR) |

## 本地（仓库内）

| 文件 | 说明 |
|------|------|
| `docs/PRD.md` | 产品需求文档 |
| `docs/DESIGN.md` | UI/UX 详细交互设计 |
| `docs/ARCHITECTURE.md` | 技术栈 + 数据库设计 + API 清单 |
| `TODO.md` | 开发任务清单（唯一开发任务源） |

## 同步规则

- 本地文档是**开发时的唯一事实源**，改代码前先看本地。
- 每完成一个模块：更新本地 `PRD.md` / `ARCHITECTURE.md` → 更新 `TODO.md` → 同步回 Docs。
- Docs 侧同步采用**全文覆盖**（`word +write --position REPLACE_ALL`），保留 docId 不变。
