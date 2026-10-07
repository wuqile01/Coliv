/**
 * 费用分摊核心计算逻辑 — 纯函数，无副作用
 * 支持：均分 / 按在场天数 / 仅购买者 / 自定义比例
 */

export type SplitMethod = "equal" | "by_days" | "purchaser_only" | "custom";

export interface MemberPresence {
  memberId: string;
  daysPresent: number; // 计费周期内在场天数
  isExempt?: boolean;  // 标记为不在场
}

export interface SplitResult {
  memberId: string;
  amount: number;
  daysPresent?: number;
  ratio?: number;
}

/**
 * 均分（忽略不在场标记，在场天数不影响）
 */
export function splitEqual(totalAmount: number, memberIds: string[]): SplitResult[] {
  if (memberIds.length === 0) return [];
  const per = Math.round((totalAmount / memberIds.length) * 100) / 100;
  const results = memberIds.map((id) => ({ memberId: id, amount: per }));
  // 修正舍入误差：最后一个人多或少补几分
  const diff = Math.round((totalAmount - per * memberIds.length) * 100) / 100;
  if (diff !== 0) results[results.length - 1].amount = Math.round((results[results.length - 1].amount + diff) * 100) / 100;
  return results;
}

/**
 * 按在场天数分摊（仅对 isExempt=false 的成员计算）
 */
export function splitByDays(totalAmount: number, presences: MemberPresence[]): SplitResult[] {
  const active = presences.filter((p) => !p.isExempt && p.daysPresent > 0);
  if (active.length === 0) return presences.map((p) => ({ memberId: p.memberId, amount: 0 }));

  const totalDays = active.reduce((sum, p) => sum + p.daysPresent, 0);

  const results: SplitResult[] = presences.map((p) => {
    if (p.isExempt || p.daysPresent === 0) return { memberId: p.memberId, amount: 0, daysPresent: 0 };
    const ratio = p.daysPresent / totalDays;
    return {
      memberId: p.memberId,
      amount: Math.round(totalAmount * ratio * 100) / 100,
      daysPresent: p.daysPresent,
      ratio,
    };
  });

  // 修正舍入误差
  const sumActual = results.reduce((s, r) => s + r.amount, 0);
  const diff = Math.round((totalAmount - sumActual) * 100) / 100;
  if (diff !== 0) {
    const lastActive = results.filter((r) => (r.amount ?? 0) > 0).at(-1);
    if (lastActive) lastActive.amount = Math.round((lastActive.amount + diff) * 100) / 100;
  }

  return results;
}

/**
 * 仅购买者承担全部费用
 */
export function splitPurchaserOnly(totalAmount: number, purchaserId: string, memberIds: string[]): SplitResult[] {
  return memberIds.map((id) => ({
    memberId: id,
    amount: id === purchaserId ? totalAmount : 0,
  }));
}

/**
 * 自定义比例（ratios 需为小数，加和应为 1，否则自动归一化）
 */
export function splitCustom(totalAmount: number, ratioMap: Record<string, number>): SplitResult[] {
  const entries = Object.entries(ratioMap);
  if (entries.length === 0) return [];

  const totalRatio = entries.reduce((sum, [, r]) => sum + r, 0);
  if (totalRatio <= 0) return entries.map(([id]) => ({ memberId: id, amount: 0 }));

  const results: SplitResult[] = entries.map(([id, r]) => ({
    memberId: id,
    ratio: r / totalRatio,
    amount: Math.round((totalAmount * (r / totalRatio)) * 100) / 100,
  }));

  const sumActual = results.reduce((s, r) => s + r.amount, 0);
  const diff = Math.round((totalAmount - sumActual) * 100) / 100;
  if (diff !== 0) results[results.length - 1].amount = Math.round((results[results.length - 1].amount + diff) * 100) / 100;

  return results;
}

/**
 * 统一入口
 */
export function computeSplit(
  totalAmount: number,
  method: SplitMethod,
  memberIds: string[],
  opts: {
    presences?: MemberPresence[];
    purchaserId?: string;
    ratioMap?: Record<string, number>;
  } = {}
): SplitResult[] {
  switch (method) {
    case "equal":
      return splitEqual(totalAmount, memberIds);
    case "by_days":
      return splitByDays(totalAmount, opts.presences ?? memberIds.map((id) => ({ memberId: id, daysPresent: 30 })));
    case "purchaser_only":
      return splitPurchaserOnly(totalAmount, opts.purchaserId ?? memberIds[0], memberIds);
    case "custom":
      return splitCustom(totalAmount, opts.ratioMap ?? Object.fromEntries(memberIds.map((id) => [id, 1])));
    default:
      return splitEqual(totalAmount, memberIds);
  }
}

/**
 * 最优结算路径（债务简化算法）
 * 输入：每个成员的净余额（正=应收，负=应付）
 * 输出：最少转账次数的还款路径
 */
export interface NetBalance {
  memberId: string;
  net: number; // 正=应收，负=应付
}

export interface TransferRoute {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export function computeOptimalSettlement(balances: NetBalance[]): TransferRoute[] {
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ ...b, net: Math.abs(b.net) }))
    .sort((a, b) => b.net - a.net);

  const routes: TransferRoute[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.round(Math.min(creditors[ci].net, debtors[di].net) * 100) / 100;
    if (amount > 0) {
      routes.push({ fromMemberId: debtors[di].memberId, toMemberId: creditors[ci].memberId, amount });
    }
    creditors[ci].net = Math.round((creditors[ci].net - amount) * 100) / 100;
    debtors[di].net = Math.round((debtors[di].net - amount) * 100) / 100;
    if (creditors[ci].net < 0.01) ci++;
    if (debtors[di].net < 0.01) di++;
  }

  return routes;
}
