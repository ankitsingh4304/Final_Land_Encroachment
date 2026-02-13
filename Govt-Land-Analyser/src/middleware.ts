import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/admin/signup") return false;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/user")) return true;
  return false;
}

function getLoginRedirect(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/login?role=admin";
  return "/login?role=user";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    const loginUrl = getLoginRedirect(pathname);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};
