import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// "Wall public" mode (Next 16 Proxy, formerly Middleware).
//
// OFF by default (WALL_PUBLIC_MODE unset) → this is a no-op and Vercel's own
// Deployment Protection keeps gating everything. Deploying it changes nothing.
//
// To make /wall public while the rest stays gated, WITHOUT changing the URL:
//   1. Set env SITE_PASSWORD = <shared password> on the project.
//   2. Set env WALL_PUBLIC_MODE = 1.  Redeploy.
//   3. Turn OFF Vercel Deployment Protection for the project.
// Result: /wall (+ its assets) is public; every other route asks for the
// shared password (browser Basic Auth prompt). Fails closed: if WALL_PUBLIC_MODE
// is on but SITE_PASSWORD is missing, gated routes return 503 (never exposed).

const PUBLIC_PREFIXES = ["/wall", "/api/wall", "/prompts", "/headshots", "/poster-elements"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Routes that always require the admin password (Basic Auth), even though the
// rest of the site is public. Moderating the wall must not be open to everyone.
const ADMIN_PREFIXES = ["/wall-admin", "/api/wall-admin"];

function isAdmin(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function basicAuthOk(request: NextRequest, password: string): boolean {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const pass = decoded.split(":").slice(1).join(":"); // accept any username
    return pass === password;
  } catch {
    return false;
  }
}

function challenge(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI Day Admin"' },
  });
}

export function proxy(request: NextRequest) {
  // Always gate the moderation routes, independent of public mode. Uses the
  // shared SITE_PASSWORD (ADMIN_PASSWORD overrides it if you ever want a
  // separate one). Fails closed if neither is set.
  if (isAdmin(request.nextUrl.pathname)) {
    const adminPw = process.env.ADMIN_PASSWORD || process.env.SITE_PASSWORD;
    if (!adminPw) return new NextResponse("Admin not configured", { status: 503 });
    return basicAuthOk(request, adminPw) ? NextResponse.next() : challenge();
  }

  // No-op unless explicitly switched on (Vercel protection handles gating).
  if (process.env.WALL_PUBLIC_MODE !== "1") return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  // Optional: expose the board home publicly too (Meet links hidden via PUBLIC_BOARD).
  if (process.env.PUBLIC_BOARD === "1" && pathname === "/") return NextResponse.next();

  const password = process.env.SITE_PASSWORD;
  if (!password) {
    // App-auth turned on but no password set — fail closed, don't expose pages.
    return new NextResponse("Auth not configured", { status: 503 });
  }

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const pass = decoded.split(":").slice(1).join(":"); // accept any username
      if (pass === password) return NextResponse.next();
    } catch {
      /* fall through to challenge */
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI Day Board"' },
  });
}

export const config = {
  // Run on everything except Next internals + favicon (assets handled via the
  // public allowlist above so the wall's images/CSS load).
  matcher: ["/((?!_next|favicon.ico).*)"],
};
