import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth-core";

const PUBLIC_PATHS = ["/signin", "/signup", "/api/auth"];

/**
 * 中间件运行在 Edge Runtime，无法使用 Prisma 查询用户。
 * 这里只做「会话 cookie 是否有效」的轻量校验（HMAC 验签 + 过期检查），
 * 用户真实性与房屋归属在页面/接口内通过 getCurrentIdentity 二次确认。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const userId = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!userId) {
    const loginUrl = new URL("/signin", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
