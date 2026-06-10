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
    const images = (m?.images ?? []).map(({ src, handle, ts, hidden, flip, model }) => ({
      src,
      handle: handle ?? "",
      ts: ts ?? "",
      hidden: Boolean(hidden),
      flip: Boolean(flip),
      model: model ?? "pro", // legacy images predate the field; they were all Pro
    }));
    // Newest first.
    images.reverse();
    // Lifetime render tally + optional budget estimate (for "credits left").
    const rendered = m?.rendered ?? { pro: 0, flash: 0 };
    const budgetUsd = Number(process.env.GEMINI_BUDGET_USD || 0);
    const proCost = Number(process.env.GEMINI_PRO_IMAGE_COST || 0);   // $ per Pro image
    const flashCost = Number(process.env.GEMINI_FLASH_IMAGE_COST || 0); // $ per flash image
    const spent = rendered.pro * proCost + rendered.flash * flashCost;
    const budget =
      budgetUsd > 0 && (proCost > 0 || flashCost > 0)
        ? { budgetUsd, spent: Math.round(spent * 100) / 100, remaining: Math.round((budgetUsd - spent) * 100) / 100, proCost, flashCost }
        : null;
    return NextResponse.json({ images, rendered, budget, paused: m?.paused ?? true });
  } catch (e) {
    return NextResponse.json({ images: [], error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let ts: string, hidden: boolean | undefined, remove: boolean | undefined, flip: boolean | undefined, paused: boolean | undefined, handle: string | undefined;
  try {
    ({ ts, hidden, remove, flip, paused, handle } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  // Global pause toggle for the /snap booth — no ts needed.
  if (typeof paused === "boolean") {
    try {
      const { setPaused } = await import("@/lib/wall-store");
      const m = await setPaused(paused);
      if (!m) return NextResponse.json({ error: "Manifest unavailable" }, { status: 503 });
      return NextResponse.json({ ok: true, paused });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 502 });
    }
  }
  if (!ts) return NextResponse.json({ error: "Need { ts }" }, { status: 400 });
  try {
    // remove: drop the manifest entry (file stays in repo -> orphaned).
    if (remove === true) {
      const { removeImage } = await import("@/lib/wall-store");
      const m = await removeImage(ts);
      if (!m) return NextResponse.json({ error: "Manifest unavailable" }, { status: 503 });
      return NextResponse.json({ ok: true, removed: true });
    }
    // flip: mirror (horizontal flip) the portrait on the wall.
    if (typeof flip === "boolean") {
      const { setFlip } = await import("@/lib/wall-store");
      const m = await setFlip(ts, flip);
      if (!m) return NextResponse.json({ error: "Manifest unavailable" }, { status: 503 });
      return NextResponse.json({ ok: true, flip });
    }
    // handle: set/replace the caption (claim an anonymous snap for a person).
    if (typeof handle === "string") {
      const { setHandle } = await import("@/lib/wall-store");
      const m = await setHandle(ts, handle.trim());
      if (!m) return NextResponse.json({ error: "Manifest unavailable" }, { status: 503 });
      return NextResponse.json({ ok: true, handle: handle.trim() });
    }
    if (typeof hidden !== "boolean") {
      return NextResponse.json({ error: "Need { ts, hidden }, { ts, flip }, { ts, handle } or { ts, remove }" }, { status: 400 });
    }
    const { setHidden } = await import("@/lib/wall-store");
    const m = await setHidden(ts, hidden);
    if (!m) return NextResponse.json({ error: "Manifest unavailable" }, { status: 503 });
    return NextResponse.json({ ok: true, hidden });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
