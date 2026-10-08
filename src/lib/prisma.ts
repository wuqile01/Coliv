import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 数据库连接串修正
 *
 * Supabase 提供两种连接模式：
 *   6543 = Transaction pooler：不支持 prepared statement，必须加 ?pgbouncer=true，
 *          但该参数会让 Prisma 每次查询多一次协议往返（实测 100ms → 530ms）
 *   5432 = Session 模式：支持 prepared statement，查询快且并发安全
 *
 * 这里把误配的 6543 自动纠正为 5432，避免每次都改环境变量。
 * 如果将来换成非 Supabase 的数据库，可通过 DB_CONN_MODE=raw 关闭此逻辑。
 */
function normalizeDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (process.env.DB_CONN_MODE === "raw") return raw;

  let url = raw;

  // Supabase pooler 的 6543（Transaction 模式）不支持 prepared statement，
  // 改成 5432（Session 模式），并去掉拖慢查询的 pgbouncer=true
  if (url.includes("pooler.supabase.com:6543")) {
    url = url.replace(":6543", ":5432");
  }
  url = url.replace(/[?&]pgbouncer=true/g, "").replace(/\?&/, "?").replace(/[?&]$/, "");

  // Session 模式受 Supabase pool_size 限制（默认 15），
  // 限制本地连接池避免 EMAXCONNSESSION
  if (url.includes("pooler.supabase.com:5432") && !url.includes("connection_limit=")) {
    url += (url.includes("?") ? "&" : "?") + "connection_limit=5&pool_timeout=20";
  }

  return url;
}

const datasourceUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
