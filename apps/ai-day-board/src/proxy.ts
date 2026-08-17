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
//
// SCREEN TOKEN (added for the Aug 19 2026 signage run):
// Office signage players have no keyboard, so they can never satisfy the Basic
// Auth prompt that LOCKDOWN puts on every route. Set env SCREEN_TOKEN and the
// player can open `?screen=<token>` once; the token is exchanged for a cookie so
// the page's own fetches (notably /api/wall, which LOCKDOWN also gates) keep
// working for the rest of the run. Leave SCREEN_TOKEN unset and this is inert.
// The token is a shared display key, not per-viewer access control, so it never
// opens the moderation routes (the admin check below runs first and wins).
//
// SUBMISSION TOKEN (same run): the monitors show a QR to the photo booth, and a
// phone cannot type the password either. Set env SNAP_TOKEN and the QR carries
// `?k=<token>`, which opens the submission routes and nothing else. The QR image
// is rendered by /api/join-qr on the server so the key never reaches a
// third-party QR service or the client bundle.

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
    // Trimmed on both sides. These passwords get copied out of a Slack post by
    // hundreds of people, and a pasted trailing space is the most likely reason
    // a correct password gets rejected.
    return pass.trim() === password.trim();
  } catch {
    return false;
  }
}

// Screen token: the query-param handshake a keyboardless signage player can do.
const SCREEN_QUERY_PARAM = "screen";
const SCREEN_COOKIE = "aiday_screen";

// Submission token: the key encoded in the QR code on the monitors, so people
// can reach the photo booth from their phones without the shared password.
//
// Treat this key as visible to anyone standing in an office, because it is: a
// QR on a wall can be scanned or photographed by whoever walks past. So it is
// deliberately scoped to the submission routes ONLY and kept separate from the
// display key, which means neither key can be used to reach what the other
// opens, and either can be rotated without disturbing the other.
//
// SNAP_PREFIXES is the whole surface this key exposes. /api/users is the one
// worth thinking twice about: it serves the workspace directory that powers the
// "pick your name" step. Adding anything here widens what a scanned QR reaches.
const SNAP_QUERY_PARAM = "k";
const SNAP_COOKIE = "aiday_snap";

// A SECOND pre-signed key for the same submission routes, for the link that goes
// out in company comms. Dan asked for "another pre-signed url to the image submit
// portal" specifically so employees get no login prompt at their desks.
//
// Separate from SNAP_TOKEN on purpose. SNAP_TOKEN is what the on-screen QR
// encodes and it never leaves the office; this one goes to ~800 inboxes, so it is
// the far likelier to leak. Keeping them apart means this can be rotated without
// changing the QR on the monitors, and vice versa.
const SUBMIT_QUERY_PARAM = "s";
const SUBMIT_COOKIE = "aiday_submit";
const SNAP_PREFIXES = ["/snap", "/api/snap", "/api/snap-status", "/api/users"];

function isSnapPath(pathname: string): boolean {
  return SNAP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
// The employee password: one secret covering both halves of what a person does,
// watch the wall and make their own portrait. Deliberately NOT SITE_PASSWORD.
//
// SITE_PASSWORD opens the whole board, including the poster and profile studios
// and the schedule, so it can never be circulated: handing it out would hand over
// the roster, titles and headshots, which is exactly the surface Dan asked us to
// close after June. This one opens the wall and the booth and nothing else, so it
// is safe to send round and safe to change without locking the team out.
//
// Why a password and not another link key: a key lives in the URL, so forwarding
// the link forwards the access, and mailing one to the whole company would put it
// everywhere. A password does not travel with the link.
//
// Link keys stay for the things that cannot type: the players, and phones scanning
// the QR off a monitor in the building. Everyone else uses this.
const EMPLOYEE_PREFIXES = [
  "/wall", "/api/wall", "/api/join-qr", // watch
  "/snap", "/api/snap", "/api/snap-status", "/api/users", // take part
  // The wall polls this to notice a new deploy and reload itself. Leaving it out
  // is what made the password prompt reappear every few seconds for a viewer: the
  // page authenticated fine, then this poll 401'd on a loop behind it.
  "/api/version",
];

function isEmployeePath(pathname: string): boolean {
  return EMPLOYEE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Long enough to cover the ~2-week unattended run without anyone revisiting the
// token URL, short enough that a stolen cookie does not last forever.
const SCREEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Expiry for the pre-signed links, requested by Dan Margulies on 2026-08-06:
// "These links can have validity from now until some amount of time after the
// event, and then it should close."
//
// LINK_KEYS_EXPIRE is an ISO timestamp. Past it, every link key stops being
// accepted and those URLs fall through to the password gate instead — the pages
// keep working for anyone with the password, the no-login shortcut is simply
// closed. Unset means no expiry.
//
// An unparseable value is treated as "no expiry" rather than "expired". A typo in
// this variable should not take the office screens dark mid-event; the failure
// mode of a stale link outliving its date is the lesser one, and it is visible in
// the value itself.
function linkKeysExpired(): boolean {
  const raw = process.env.LINK_KEYS_EXPIRE;
  if (!raw) return false;
  const at = Date.parse(raw);
  if (Number.isNaN(at)) return false;
  return Date.now() > at;
}

type TokenAuth = "none" | "cookie" | "query";

// Returns how (if at all) this request presented a valid token.
// "query" means it came in the URL and still needs trading for a cookie.
function tokenAuth(
  request: NextRequest,
  token: string | undefined,
  cookieName: string,
  queryParam: string,
): TokenAuth {
  if (!token) return "none"; // feature off — no token configured
  if (request.cookies.get(cookieName)?.value === token) return "cookie";
  if (request.nextUrl.searchParams.get(queryParam) === token) return "query";
  return "none";
}

// Let the holder through, and on the initial token URL trade the query param for
// a cookie so subsequent navigations and same-origin fetches carry the proof.
// The phone keeps this cookie, so a person only ever scans the QR once.
function allowToken(how: TokenAuth, cookieName: string, token: string): NextResponse {
  const response = NextResponse.next();
  if (how === "query") {
    response.cookies.set({
      name: cookieName,
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: SCREEN_COOKIE_MAX_AGE,
    });
  }
  return response;
}

// The realm is the only text a browser password prompt shows, so it has to read
// sensibly to whoever sees it: employees used to be asked for "AI Day Admin",
// which sounds like somewhere they should not be.
//
// It is also deliberately ONE value for the whole site. A browser caches
// credentials per realm, so two realms on one origin mean a stray 401 anywhere
// prompts again from scratch instead of quietly reusing what was already typed.
const REALM = "AI Day";

function challenge(realm = REALM): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${realm}"` },
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

  // Let the backend render cron through the gate. It authenticates itself via
  // CRON_SECRET (Vercel injects it as a Bearer header on cron invocations), and
  // the route rejects anything without it. Without this exemption the LOCKDOWN
  // Basic-Auth gate 401s the Vercel cron and the photo pipeline silently stops
  // processing (this is what stranded snaps after the 2026-06-17 lockdown).
  if (request.nextUrl.pathname === "/api/process-photos") return NextResponse.next();
  // Same for the catch-up sweep: it authenticates itself with CRON_SECRET.
  if (request.nextUrl.pathname === "/api/portrait-sweep") return NextResponse.next();
  if (request.nextUrl.pathname === "/api/deactivated-sweep") return NextResponse.next();

  // Static design assets the render pipeline depends on (backgrounds, cutouts,
  // poster art). Non-sensitive, and public pre-lockdown. The render fetches
  // /headshots/bg from its own origin while stylizing; if the gate 401s that
  // fetch, Gemini receives a broken background and every render fails with a
  // "400: Unable to process input image". Keep these reachable; pages stay gated.
  const assetPath = request.nextUrl.pathname;
  if (assetPath.startsWith("/headshots/") || assetPath.startsWith("/poster-elements/")) {
    return NextResponse.next();
  }
  // Portraits, served from our own origin so the CDN absorbs the load instead of
  // GitHub throttling us. Open for the same reason /headshots is: these exact
  // bytes are already public on raw.githubusercontent.com, and the signage players
  // do not keep cookies, so requiring a key here would break the screens.
  if (assetPath.startsWith("/api/portrait/")) return NextResponse.next();

  // Link keys, only while they are still in date.
  if (!linkKeysExpired()) {
    // Authorised signage player: allowed past whichever gate is active below.
    // Placed after the admin check (so a screen token can never reach /wall-admin)
    // and before LOCKDOWN, so it works in both LOCKDOWN and WALL_PUBLIC_MODE.
    const screenToken = process.env.SCREEN_TOKEN;
    const screen = tokenAuth(request, screenToken, SCREEN_COOKIE, SCREEN_QUERY_PARAM);
    if (screen !== "none") return allowToken(screen, SCREEN_COOKIE, screenToken as string);

    // Phone or desk browser arriving from the submit link or the QR: the
    // submission routes only. Checked inside the isSnapPath guard so a leaked key
    // cannot be replayed against the board, the posters or anything else, no
    // matter what URL it is appended to.
    if (isSnapPath(request.nextUrl.pathname)) {
      const snapToken = process.env.SNAP_TOKEN;
      const snap = tokenAuth(request, snapToken, SNAP_COOKIE, SNAP_QUERY_PARAM);
      if (snap !== "none") return allowToken(snap, SNAP_COOKIE, snapToken as string);

      const submitToken = process.env.SUBMIT_TOKEN;
      const submit = tokenAuth(request, submitToken, SUBMIT_COOKIE, SUBMIT_QUERY_PARAM);
      if (submit !== "none") return allowToken(submit, SUBMIT_COOKIE, submitToken as string);
    }
  }

  // Full lockdown: when LOCKDOWN=1 the ENTIRE site (every non-admin route,
  // including /wall) requires the shared SITE_PASSWORD via browser Basic Auth.
  // Used to re-secure the board after the public event window. Takes precedence
  // over WALL_PUBLIC_MODE and PUBLIC_BOARD. Fails closed if no password is set.
  // Reversible: remove the LOCKDOWN env var (and redeploy) to restore prior mode.
  // The employee password, checked before the site-wide one. A wrong answer falls
  // through so the team's SITE_PASSWORD still works everywhere as it always did.
  const employeeArea = isEmployeePath(request.nextUrl.pathname);
  const employeePassword = process.env.EMPLOYEE_PASSWORD;
  if (employeeArea && employeePassword && basicAuthOk(request, employeePassword)) return NextResponse.next();

  if (process.env.LOCKDOWN === "1") {
    const password = process.env.SITE_PASSWORD;
    if (!password) return new NextResponse("Auth not configured", { status: 503 });
    if (basicAuthOk(request, password)) return NextResponse.next();
    return challenge();
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
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

export const config = {
  // Run on everything except Next internals + favicon (assets handled via the
  // public allowlist above so the wall's images/CSS load).
  matcher: ["/((?!_next|favicon.ico).*)"],
};
