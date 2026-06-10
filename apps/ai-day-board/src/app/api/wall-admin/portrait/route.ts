// Admin-only: stream a wall portrait back as a named file download (so the
// browser saves it as "First Last.png"). Used by the /wall-admin "Download all"
// button to grab every portrait at once for a Drive folder. Gated by the admin
// password via src/proxy.ts (under /api/wall-admin). Only proxies our own hosts.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const u = url.searchParams.get("u") || "";
  const name = (url.searchParams.get("n") || "portrait.png").replace(/[^\w .()\-]+/g, "_");

  // Only allow our own image hosts (no open proxy).
  const allowed =
    u.startsWith("https://raw.githubusercontent.com/micpowl-dot/") ||
    u.startsWith(`${url.origin}/headshots/`);
  if (!allowed) return NextResponse.json({ error: "url not allowed" }, { status: 400 });

  try {
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: `fetch ${res.status}` }, { status: 502 });
    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/png",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
