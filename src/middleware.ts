import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/signin", "/signup", "/join", "/api/auth"];

/**
 * 中间件运行在 Edge Runtime，无法使用 Prisma 查询会话。
 * 这里只做「是否存在会话 cookie」的轻量探测，真实校验在
 * (dashboard)/layout.tsx 中通过 auth.api.getSession 完成。
 *
 * 演示模式（DEMO_MODE=true）：跳过登录校验，直接进入应用。
 * 用于认证模块尚未接入时预览功能，生产环境请勿开启。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 演示模式：跳过登录校验，直接进入应用
  // 注意：/signin 保持可访问，它是「切换账号」的入口
  if (process.env.DEMO_MODE === "true") {
    if (pathname === "/signup") {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("session_token"));

  if (!hasSessionCookie) {
    const loginUrl = new URL("/signin", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
