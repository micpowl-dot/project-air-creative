// Cron-driven Path A pipeline: pull new photos from the Slack headshot channel,
// stylize each into the AI Day illustrated look on a random branded background,
// store the result on Vercel Blob, and append it to the wall feed.
//
// Triggered by Vercel Cron (see vercel.json). Needs env:
//   WALL_SLACK_TOKEN        Slack token with channels:history + files:read
//   HEADSHOT_SLACK_CHANNEL  channel ID people post photos to
//   GEMINI_API_KEY          Nano Banana (Gemini image) key
//   (Blob store connected → BLOB_READ_WRITE_TOKEN auto-set)
//   CRON_SECRET             optional; if set, the cron request must carry it
//
// No-ops (returns 200 with a note) if env is missing, so it never breaks deploys.

import { NextResponse } from "next/server";
import { stylize, randomBg } from "@/lib/stylize-core";
import { readManifest, writeManifest, putImage, type WallManifest } from "@/lib/wall-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_PER_RUN = 4; // bound work per cron tick; frequent cron drains the rest

async function fetchB64(url: string): Promise<string> {
  const r = await fetch(url, { cache: "no-store" });
  return Buffer.from(await r.arrayBuffer()).toString("base64");
}

const nameCache = new Map<string, string>();
async function resolveHandle(user: string, token: string): Promise<string> {
  if (!user) return "";
  if (nameCache.has(user)) return nameCache.get(user)!;
  try {
    const r = await fetch(`https://slack.com/api/users.info?user=${user}`, { headers: { Authorization: `Bearer ${token}` } });
    const b = await r.json();
    const p = b.ok ? b.user?.profile : null;
    const dn = (p?.display_name || p?.real_name || "").trim().toLowerCase().replace(/\s+/g, ".");
    const h = dn ? `@${dn}` : "";
    nameCache.set(user, h);
    return h;
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.WALL_SLACK_TOKEN;
  const channel = process.env.HEADSHOT_SLACK_CHANNEL;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!token || !channel || !apiKey) {
    return NextResponse.json({ skipped: "missing env: need WALL_SLACK_TOKEN, HEADSHOT_SLACK_CHANNEL, GEMINI_API_KEY" });
  }

  let manifest: WallManifest | null;
  try {
    manifest = await readManifest();
  } catch (e) {
    return NextResponse.json({ error: "blob_unavailable", detail: String(e) }, { status: 200 });
  }

  // First run: don't chew the backlog — start the clock now, process nothing.
  if (!manifest) {
    const init: WallManifest = { lastTs: String(Date.now() / 1000), images: [] };
    try { await writeManifest(init); } catch { /* ignore */ }
    return NextResponse.json({ initialized: true, lastTs: init.lastTs });
  }

  // New image posts since lastTs.
  const histRes = await fetch(
    `https://slack.com/api/conversations.history?channel=${channel}&oldest=${manifest.lastTs}&limit=50`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const hist = await histRes.json();
  if (!hist.ok) return NextResponse.json({ error: "slack", detail: hist.error });

  const msgs = (hist.messages || [])
    .filter((m: { ts: string; files?: unknown[] }) => Array.isArray(m.files) && Number(m.ts) > Number(manifest!.lastTs))
    .sort((a: { ts: string }, b: { ts: string }) => Number(a.ts) - Number(b.ts));

  const origin = new URL(request.url).origin;
  const styleData = await fetchB64(`${origin}/headshots/cutout/max-jacubowsky.png`);

  let processed = 0;
  let newLastTs = manifest.lastTs;
  const errors: string[] = [];

  for (const m of msgs as { ts: string; user: string; text?: string; files: { mimetype?: string; url_private?: string; url_private_download?: string }[] }[]) {
    if (processed >= MAX_PER_RUN) break;
    newLastTs = m.ts; // advance regardless so we don't re-scan
    const file = m.files.find((f) => String(f.mimetype || "").startsWith("image/"));
    if (!file) continue;
    try {
      const dl = await fetch(file.url_private_download || file.url_private || "", { headers: { Authorization: `Bearer ${token}` } });
      const personData = Buffer.from(await dl.arrayBuffer()).toString("base64");
      const bg = randomBg();
      const bgData = await fetchB64(`${origin}/headshots/bg/${bg}.png`);
      const out = await stylize({
        apiKey,
        style: { mimeType: "image/png", data: styleData },
        person: { mimeType: file.mimetype || "image/jpeg", data: personData },
        background: { mimeType: "image/png", data: bgData },
      });
      const url = await putImage(m.ts.replace(".", ""), Buffer.from(out, "base64"));
      // The /snap upload posts a real <@mention>; resolve THAT to the handle
      // (the message author is the bot). Fall back to the poster otherwise.
      const mentioned = (m.text || "").match(/<@(U[A-Z0-9]+)>/)?.[1];
      const handle = await resolveHandle(mentioned || m.user, token);
      manifest.images.push({ src: url, handle, ts: m.ts });
      processed++;
    } catch (e) {
      errors.push(`${m.ts}: ${String(e).slice(0, 120)}`);
    }
  }

  manifest.lastTs = newLastTs;
  manifest.images = manifest.images.slice(-400);
  try { await writeManifest(manifest); } catch (e) { errors.push(`write: ${String(e).slice(0, 120)}`); }

  return NextResponse.json({ processed, total: manifest.images.length, lastTs: manifest.lastTs, errors });
}
