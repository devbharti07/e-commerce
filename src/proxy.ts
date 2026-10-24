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

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
};

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, val] of Object.entries(SECURITY_HEADERS)) {
    if (!res.headers.has(key)) {
      res.headers.set(key, val);
    }
  }
  return res;
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/api/health")) return true;
  if (pathname.startsWith("/api/availability")) return true;
  if (pathname.startsWith("/catalog")) return true;
  if (pathname.startsWith("/products/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|css|js)$/)) return true;
  return false;
}

export function isSafeRedirectPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  // Must start with '/' and strictly disallow protocol-relative '//', '/\', or any backslash '\'
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\") || url.includes("\\")) {
    return false;
  }
  // Disallow scheme indicators or control characters
  if (url.includes("://") || /[\x00-\x1F\x7F]/.test(url)) {
    return false;
  }
  try {
    const parsed = new URL(url, "http://localhost");
    // Ensure origin didn't mutate (e.g. protocol relative bypasses)
    if (parsed.origin !== "http://localhost") {
      return false;
    }
    // Ensure pathname still starts with / and not //
    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getSafeRedirectPath(url: string | null | undefined, fallback: string): string {
  return isSafeRedirectPath(url) ? url! : fallback;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // CSRF Protection for state-changing requests with auth cookie
  const method = request.method.toUpperCase();
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (pathname.startsWith("/api/") && isStateChanging && token) {
    const isPublicAuthEndpoint =
      pathname.startsWith("/api/auth/login") ||
      pathname.startsWith("/api/auth/register") ||
      pathname === "/api/notifications/subscribe";

    if (!isPublicAuthEndpoint) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const host = request.headers.get("host");

      if (origin) {
        try {
          const originHost = new URL(origin).host;
          if (host && originHost !== host) {
            return applySecurityHeaders(
              NextResponse.json(
                { error: "Forbidden: CSRF check failed (origin mismatch)" },
                { status: 403 }
              )
            );
          }
        } catch {
          return applySecurityHeaders(
            NextResponse.json(
              { error: "Forbidden: CSRF check failed (malformed origin)" },
              { status: 403 }
            )
          );
        }
      } else if (referer) {
        try {
          const refererHost = new URL(referer).host;
          if (host && refererHost !== host) {
            return applySecurityHeaders(
              NextResponse.json(
                { error: "Forbidden: CSRF check failed (referer mismatch)" },
                { status: 403 }
              )
            );
          }
        } catch {
          return applySecurityHeaders(
            NextResponse.json(
              { error: "Forbidden: CSRF check failed (malformed referer)" },
              { status: 403 }
            )
          );
        }
      }
    }
  }

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
    return applySecurityHeaders(NextResponse.redirect(new URL(safeTarget, request.url)));
  }

  if (sessionUser && sessionUser.role === "OWNER" && pathname === "/admin/login") {
    return applySecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
  }

  // 2. Allow public paths to pass through
  if (isPublicPath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return applySecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  }

  // 3. For API routes other than auth/health: let endpoint authorization guards (requireUser/requireOwner) handle responses
  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return applySecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  }

  // 4. Protect Admin Pages: requires authenticated OWNER
  if (pathname.startsWith("/admin")) {
    if (!sessionUser) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (sessionUser.role !== "OWNER") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized_admin");
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // 5. Protect Storefront Pages: requires authenticated approved user
  if (!sessionUser) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
