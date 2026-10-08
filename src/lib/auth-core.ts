import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

/**
 * 轻量密码哈希（scrypt）
 *
 * 存储格式：scrypt$<salt-hex>$<hash-hex>
 * 不引入 bcrypt/argon2 依赖，node:crypto 自带 scrypt 抗暴力破解能力足够。
 */

const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

/** 校验密码；格式不合法时返回 false，不抛异常 */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, salt, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hashHex) return false;

  try {
    const derived = await scrypt(password, salt, KEYLEN);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    // 恒定时间比较，避免时序侧信道
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ──────────────────────────────────
// 会话 Cookie（HMAC 签名，无状态）
// ──────────────────────────────────

export const SESSION_COOKIE = "coliv_session";
const SESSION_DAYS = 30;

function secret(): string {
  // 生产环境务必设置 AUTH_SECRET；缺失时退回开发默认值并打警告
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[auth] AUTH_SECRET 未设置，正在使用不安全的默认密钥");
    }
    return "coliv-dev-secret-change-me";
  }
  return s;
}

/** 载荷：userId.过期时间戳，签名后拼在后面 */
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** 生成会话 token：<userId>.<exp>.<sig> */
export function createSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** 校验会话 token，返回 userId；无效或过期返回 null */
export function readSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expStr, sig] = parts;
  const payload = `${userId}.${expStr}`;
  const expectedSig = sign(payload);

  // 长度不同时 timingSafeEqual 会抛错，先比长度
  if (sig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  return userId;
}

export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
