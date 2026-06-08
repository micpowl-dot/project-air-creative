// Moderation API for the wall gallery (/wall-admin).
//   GET  → every image in the manifest, including hidden ones (with ts + hidden).
//   POST → { ts, hidden } toggles an image's visibility on the wall.
//
// Gated by the proxy (Basic Auth via ADMIN_PASSWORD) — see src/proxy.ts.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { readManifest } = await import("@/lib/wall-store");
    const m = await readManifest();
    const images = (m?.images ?? []).map(({ src, handle, ts, hidden, model }) => ({
      src,
      handle: handle ?? "",
      ts: ts ?? "",
      hidden: Boolean(hidden),
      model: model ?? "pro", // legacy images predate the field; they were all Pro
    }));
    // Newest first.
    images.reverse();
    return NextResponse.json({ images });
  } catch (e) {
    return NextResponse.json({ images: [], error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let ts: string, hidden: boolean;
  try {
    ({ ts, hidden } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!ts || typeof hidden !== "boolean") {
    return NextResponse.json({ error: "Need { ts, hidden }" }, { status: 400 });
  }
  try {
    const { setHidden } = await import("@/lib/wall-store");
    const m = await setHidden(ts, hidden);
    if (!m) return NextResponse.json({ error: "Manifest unavailable" }, { status: 503 });
    return NextResponse.json({ ok: true, hidden });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
