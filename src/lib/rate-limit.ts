import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * 进程内简易限流（固定窗口）。
 * 单实例部署足够；多实例部署应换成 Redis 等共享存储。
 */
export function checkBudget(
  request: Request,
  key: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  // 取真实来源 IP；Railway 等反代下优先用 x-forwarded-for 首段
  const fwd = request.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const id = `${key}:${ip}`;

  const now = Date.now();
  const bucket = buckets.get(id);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    // 顺手清理过期桶，避免内存无限增长
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    return null;
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { message: "操作过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  bucket.count += 1;
  return null;
}
