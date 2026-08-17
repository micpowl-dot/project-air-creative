// Admin-only: re-render one portrait from its original selfie using the CURRENT
// stylize prompt/models (Pro first, Flash fallback). Replaces the image in place
// on the manifest entry. Use to fix renders that came out wrong (e.g. Flash
// bleeding the style reference's identity) without making the person re-snap.
//
//   POST /api/wall-admin/rerender { ts }
// Gated by the admin password via src/proxy.ts (under /api/wall-admin).
import { NextResponse } from "next/server";
import { stylize, randomBg, STANDARD_MODEL, STYLE_REFS } from "@/lib/stylize-core";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  let ts: string;
  try {
    ({ ts } = await request.json());
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (!ts) return NextResponse.json({ error: "need ts" }, { status: 400 });

  const token = process.env.WALL_SLACK_TOKEN;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!token || !apiKey) return NextResponse.json({ error: "missing env" }, { status: 503 });
  const channel = process.env.HEADSHOT_SLACK_CHANNEL;

  const { readManifest, writeManifest, putImage, viaOwnOrigin } = await import("@/lib/wall-store");
  const manifest = await readManifest();
  if (!manifest) return NextResponse.json({ error: "manifest unavailable" }, { status: 503 });
  const entry = manifest.images.find((i) => i.ts === ts);
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Resolve the original selfie URL: stored on the entry, or looked up by ts.
  let srcUrl = entry.srcUrl;
  if (!srcUrl && channel) {
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
      srcUrl = file?.url_private;
    } catch {
      /* ignore */
    }
  }
  if (!srcUrl) return NextResponse.json({ error: "source not found" }, { status: 404 });

  try {
    const origin = new URL(request.url).origin;
    // Original selfie (private Slack file → base64).
    const pres = await fetch(srcUrl, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!pres.ok) return NextResponse.json({ error: `source ${pres.status}` }, { status: 502 });
    const personMime = pres.headers.get("content-type") || "image/jpeg";
    const personData = Buffer.from(await pres.arrayBuffer()).toString("base64");
    // Style reference + a fresh random background.
    const fetchB64 = async (u: string) => Buffer.from(await (await fetch(u, { cache: "no-store" })).arrayBuffer()).toString("base64");
    const styleParts = await Promise.all(
      STYLE_REFS.map(async (slug) => ({ mimeType: "image/png", data: await fetchB64(`${origin}/headshots/cutout/${slug}.png`) }))
    );
    const bg = randomBg();
    const bgData = await fetchB64(`${origin}/headshots/bg/${bg}.png`);

    const styleArgs = {
      apiKey,
      styles: styleParts,
      person: { mimeType: personMime, data: personData },
      background: { mimeType: "image/png", data: bgData },
    };
    let out: string;
    let usedModel: "pro" | "flash" = "pro";
    try {
      out = await stylize(styleArgs);
    } catch (proErr) {
      if (!/\b429\b|quota|rate limit/i.test(String(proErr))) throw proErr;
      out = await stylize({ ...styleArgs, model: STANDARD_MODEL });
      usedModel = "flash";
    }

    // New file (keep the old one as an orphan), then swap it into the entry.
    const url = await putImage(`${ts.replace(".", "")}-r${Date.now().toString(36)}`, Buffer.from(out, "base64"));
    entry.src = url;
    entry.model = usedModel;
    entry.hidden = false;
    entry.flip = false;
    manifest.rendered = manifest.rendered || { pro: 0, flash: 0 };
    manifest.rendered[usedModel]++;
    await writeManifest(manifest);
    // Hand the admin our own-origin URL, or the freshly re-rendered tile would be
    // the one image on the page still fetched straight from GitHub.
    return NextResponse.json({ ok: true, model: usedModel, src: viaOwnOrigin(url) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
