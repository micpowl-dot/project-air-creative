// Admin-only proxy for the ORIGINAL selfie behind a render, for QA in
// /wall-admin. Source photos are private (they live in the Slack intake
// channel), so this route is under /api/wall-admin and is gated by the admin
// password in src/proxy.ts — the raw photos are never exposed publicly.
//
//   GET /api/wall-admin/source?ts=<message ts>  → the original image bytes.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ts = new URL(request.url).searchParams.get("ts");
  if (!ts) return NextResponse.json({ error: "need ts" }, { status: 400 });

  const token = process.env.WALL_SLACK_TOKEN;
  if (!token) return NextResponse.json({ error: "no token" }, { status: 503 });
  const channel = process.env.HEADSHOT_SLACK_CHANNEL;

  // 1) Fast path: the source url stored on the manifest entry when it rendered.
  let fileUrl: string | undefined;
  try {
    const { readManifest } = await import("@/lib/wall-store");
    const m = await readManifest();
    fileUrl = m?.images.find((i) => i.ts === ts)?.srcUrl;
  } catch {
    /* fall through to Slack lookup */
  }

  // 2) Fallback for older renders (no stored url): look up the Slack message by
  //    ts in the intake channel and pull its image file. (Rate-limited, but
  //    admin QA is low-volume.)
  if (!fileUrl && channel) {
    try {
      const r = await fetch(
        `https://slack.com/api/conversations.history?channel=${channel}&latest=${ts}&inclusive=true&limit=1`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      const b = await r.json();
      const msg = b.ok && Array.isArray(b.messages) ? b.messages[0] : null;
      const file = (msg?.files ?? []).find((f: { mimetype?: string }) =>
        String(f.mimetype || "").startsWith("image/")
      );
      fileUrl = file?.url_private;
    } catch {
      /* ignore */
    }
  }

  if (!fileUrl) return NextResponse.json({ error: "source not found" }, { status: 404 });

  // Fetch the private Slack file with the bot token and stream it back.
  try {
    const res = await fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: `slack ${res.status}` }, { status: 502 });
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || "image/jpeg";
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": ct, "Cache-Control": "private, max-age=300" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
