import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_KEY = "biotech_token";

const publicRoutes = ["/login", "/cadastro"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.includes(".");

  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
