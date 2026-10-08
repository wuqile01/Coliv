/**
 * 公告权限逻辑测试
 *
 * 覆盖 PATCH/DELETE 的核心判定：谁能编辑、谁能置顶、谁能删除。
 * 用纯函数复刻 route.ts 的判定规则，确保规则本身自洽。
 */


/** 复刻 PATCH 的权限判定 */
function canPatch(ctx, ann, data) {
  const isAuthor = ann.authorId === ctx.memberId;
  const isOwner = ctx.isOwner;

  const editingContent = data.title !== undefined || data.content !== undefined;
  if (editingContent && !isAuthor) return { ok: false, reason: "只能编辑自己发布的公告" };
  if (data.isPinned !== undefined && !isOwner && !isAuthor) return { ok: false, reason: "只有房主或发布者可以置顶" };
  return { ok: true };
}

/** 复刻 DELETE 的权限判定 */
function canDelete(ctx, ann) {
  const isAuthor = ann.authorId === ctx.memberId;
  const isOwner = ctx.isOwner;
  if (!isAuthor && !isOwner) return { ok: false, reason: "只能删除自己发布的公告" };
  return { ok: true };
}

const OWNER = { memberId: "m-owner", isOwner: true };
const AUTHOR = { memberId: "m-author", isOwner: false };
const OTHER = { memberId: "m-other", isOwner: false };

const annByAuthor = { authorId: "m-author" };
const annByOwner = { authorId: "m-owner" };

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "✅" : "❌"} ${name}`);
  if (!ok) console.log(`     期望 ${expected}，实际 ${actual}`);
}

console.log("\n=== PATCH 编辑内容（仅作者）===");
check("作者编辑自己的 → 允许", canPatch(AUTHOR, annByAuthor, { title: "新" }).ok, true);
check("房主编辑他人的 → 拒绝", canPatch(OWNER, annByAuthor, { title: "新" }).ok, false);
check("无关成员编辑 → 拒绝", canPatch(OTHER, annByAuthor, { content: "改" }).ok, false);

console.log("\n=== PATCH 置顶（房主或作者）===");
check("作者置顶自己的 → 允许", canPatch(AUTHOR, annByAuthor, { isPinned: true }).ok, true);
check("房主置顶他人的 → 允许", canPatch(OWNER, annByAuthor, { isPinned: true }).ok, true);
check("无关成员置顶 → 拒绝", canPatch(OTHER, annByAuthor, { isPinned: true }).ok, false);

console.log("\n=== PATCH 组合操作 ===");
check("房主同时改内容+置顶 → 拒绝（内容部分）", canPatch(OWNER, annByAuthor, { title: "x", isPinned: true }).ok, false);
check("作者同时改内容+置顶 → 允许", canPatch(AUTHOR, annByAuthor, { title: "x", isPinned: true }).ok, true);

console.log("\n=== DELETE（房主或作者）===");
check("作者删自己的 → 允许", canDelete(AUTHOR, annByAuthor).ok, true);
check("作者删房主的 → 拒绝", canDelete(AUTHOR, annByOwner).ok, false);
check("房主删他人的 → 允许", canDelete(OWNER, annByAuthor).ok, true);
check("无关成员删 → 拒绝", canDelete(OTHER, annByAuthor).ok, false);

console.log("\n=== 边界：房主是自己的公告 ===");
check("房主删自己的 → 允许", canDelete(OWNER, annByOwner).ok, true);
check("作者删自己的（是房主）→ 允许", canDelete(OWNER, annByAuthor).ok, true);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
