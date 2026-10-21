import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "jagdamba_wholesale_super_secret_jwt_key_2026_secured"
);

const AUTH_COOKIE_NAME = "jm_auth_token";

const PUBLIC_EXACT_PATHS = new Set([
  "/login",
  "/register",
  "/admin/login",
  "/favicon.ico",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/api/health")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|css|js)$/)) return true;
  return false;
}

function getSafeRedirectPath(url: string | null, fallback: string): string {
  if (!url) return fallback;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("://")) {
    return url;
  }
  return fallback;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let sessionUser: { userId: string; role: string; email: string; name: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      sessionUser = payload as unknown as { userId: string; role: string; email: string; name: string };
    } catch {
      sessionUser = null;
    }
  }

  // 1. If user is already authenticated and visits public auth pages, redirect to dashboard or safe destination
  if (sessionUser && (pathname === "/login" || pathname === "/register")) {
    const rawRedirect = request.nextUrl.searchParams.get("redirect");
    const safeTarget = getSafeRedirectPath(rawRedirect, sessionUser.role === "OWNER" ? "/admin" : "/");
    return NextResponse.redirect(new URL(safeTarget, request.url));
  }

  if (sessionUser && sessionUser.role === "OWNER" && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 2. Allow public paths to pass through
  if (isPublicPath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. For API routes other than auth/health: let endpoint authorization guards (requireUser/requireOwner) handle responses
  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 4. Protect Admin Pages: requires authenticated OWNER
  if (pathname.startsWith("/admin")) {
    if (!sessionUser) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (sessionUser.role !== "OWNER") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized_admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Protect Storefront Pages: requires authenticated approved user
  if (!sessionUser) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
