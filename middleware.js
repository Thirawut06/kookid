import { NextResponse } from "next/server";

// Protect only the admin UI route at hosting layer.
// API routes under /api/admin are protected by the server-side token logic,
// so they should not be blocked by Basic Auth which would prevent fetch() calls.
function isProtectedPath(pathname) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="KooKid Admin", charset="UTF-8"',
    },
  });
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const expectedUser = process.env.ADMIN_BASIC_AUTH_USER;
  const expectedPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return new NextResponse("Admin auth is not configured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const [scheme, encoded] = authHeader.split(" ");

  if (scheme !== "Basic" || !encoded) {
    return unauthorized();
  }

  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) {
      return unauthorized();
    }

    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (user !== expectedUser || password !== expectedPassword) {
      return unauthorized();
    }
  } catch {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
