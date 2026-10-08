import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isTokenShapeValid } from "@/lib/session-shared";

const PUBLIC_PATHS = ["/signin", "/signup", "/api/auth"];

/**
 * 中间件运行在 Edge Runtime，且 process.env 会在构建时被内联，
 * 因此这里**不做签名校验**（否则 AUTH_SECRET 未参与构建会导致
 * 中间件与 API 使用不同密钥，出现登录死循环）。
 *
 * 这里只做粗筛：会话 cookie 是否存在、格式是否合法、是否已过期。
 * 真正的验签与用户/房屋归属校验，在页面与 API 的 Node 运行时完成
 * （见 lib/identity.ts 的 getCurrentIdentity / requireIdentity）。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isTokenShapeValid(token)) {
    const loginUrl = new URL("/signin", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
