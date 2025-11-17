import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes:
  // - /login
  // - /api/*
  // - Next.js static assets, images, favicon, etc.
  const isLogin = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api/");
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(.*)$/); // any file with extension

  if (isLogin || isApiRoute || isStaticAsset) {
    return NextResponse.next();
  }

  // Check for our simple auth cookie
  const hasAuth = req.cookies.get("clinicflow_auth");

  // If no cookie → redirect to /login
  if (!hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Auth cookie present → allow
  return NextResponse.next();
}

export const config = {
  // Apply to all routes (we filter inside middleware)
  matcher: "/:path*",
};