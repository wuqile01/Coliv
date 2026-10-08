/**
 * 会话 Cookie 的常量与「外形校验」
 *
 * 这个文件必须保持零依赖（不 import 任何 node:* 模块），
 * 因为 Edge Runtime 的中间件需要引用它 —— Edge 环境不支持 node:crypto 的 scrypt。
 *
 * 签名验签等需要密钥的逻辑放在 auth-core.ts，仅供 Node Runtime 使用。
 */

export const SESSION_COOKIE = "coliv_session";
export const SESSION_DAYS = 30;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

/**
 * 仅校验 token 外形（三段式、未过期），不做签名验证。
 *
 * 中间件用它做粗筛：process.env 在 Edge 会被构建时内联，
 * 拿不到可靠的密钥，因此真正的验签交给 Node 运行时。
 */
export function isTokenShapeValid(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [userId, expStr, sig] = parts;
  if (!userId || !sig) return false;
  const exp = Number(expStr);
  return Number.isFinite(exp) && Date.now() <= exp;
}
