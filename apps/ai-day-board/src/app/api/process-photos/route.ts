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

// Post the FINISHED portrait back into the photo-station channel with the real
// @mention. This is the notification the person actually sees (the raw selfie
// was posted quietly, unpinged). Best-effort — never throws. Uses an image
// block (no file attachment) so the next cron run won't re-process it.
async function postPortraitToChannel(channel: string, userId: string | null, imageUrl: string, token: string): Promise<void> {
  try {
    // @mention only when we know who snapped; otherwise a generic celebratory line.
    const heading = userId
      ? `<@${userId}> you're on the AI Day wall! ✨`
      : `✨ A new portrait just hit the AI Day wall!`;
    const sub = userId
      ? `Your illustrated portrait is now live — <https://ai-day-board.vercel.weather.com/wall|see it on the wall>.`
      : `<https://ai-day-board.vercel.weather.com/wall|See it on the live wall>.`;
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        text: heading,
        blocks: [
          { type: "section", text: { type: "mrkdwn", text: `${heading}\n${sub}` } },
          { type: "image", image_url: imageUrl, alt_text: "AI Day illustrated portrait" },
        ],
      }),
    });
  } catch {
    /* best-effort */
  }
}

// DM the person their finished portrait. Opens a DM channel then posts the
// image URL with a friendly note. Best-effort — never throws.
async function dmPortrait(userId: string, imageUrl: string, token: string): Promise<void> {
  try {
    const open = await fetch("https://slack.com/api/conversations.open", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ users: userId }),
    });
    const oj = await open.json();
    const dm = oj.ok ? oj.channel?.id : null;
    if (!dm) return;
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: dm,
        text: "You're on the AI Day wall! ✨ Here's your illustrated portrait — see it live with everyone else's at https://ai-day-board.vercel.weather.com/wall",
        blocks: [
          { type: "section", text: { type: "mrkdwn", text: "*You're on the AI Day wall!* ✨\nHere's your illustrated portrait — watch it cycle with everyone else's at <https://ai-day-board.vercel.weather.com/wall|the live wall>." } },
          { type: "image", image_url: imageUrl, alt_text: "Your AI Day illustrated portrait" },
        ],
      }),
    });
  } catch {
    /* best-effort */
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
  const MAX_ATTEMPTS = 3; // give up only on TERMINAL failures (bad image, etc.) after this many
  manifest.attempts = manifest.attempts || {};

  for (const m of msgs as { ts: string; user: string; text?: string; files: { name?: string; mimetype?: string; url_private?: string; url_private_download?: string }[] }[]) {
    if (processed >= MAX_PER_RUN) break;
    const file = m.files.find((f) => String(f.mimetype || "").startsWith("image/"));
    if (!file) { newLastTs = m.ts; continue; } // non-image: skip past permanently
    // Image processing ALWAYS uses Pro (Nano Banana Pro) for best likeness —
    // no flash-model fallback. Transient Pro failures just keep retrying.
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
      // Resolve who snapped. Current /api/snap encodes the user id in the
      // filename (snap-<ts>-<U…>.ext); older messages used a `ref:<id>` token
      // or a real <@mention> in the text. Try each in order.
      const uid =
        (file.name || "").match(/-(U[A-Z0-9]+)\.[a-z0-9]+$/i)?.[1] ||
        (m.text || "").match(/ref:(U[A-Z0-9]+)/)?.[1] ||
        (m.text || "").match(/<@(U[A-Z0-9]+)>/)?.[1];
      // Caption only when we know who (no falling back to the bot's own handle
      // for anonymous snaps — that produced a bogus "@ai.day.wall" caption).
      const handle = uid ? await resolveHandle(uid, token) : "";
      // One image per tagged person ON THE WALL: hide (don't delete) any earlier
      // render for this handle so only the latest is active. Prior versions stay
      // in /wall-admin, grayed out, and can be re-activated by tapping them.
      // (Anonymous snaps have no handle, so they're never deduped against.)
      if (handle) {
        for (const i of manifest.images) {
          if ((i.handle || "") === handle) i.hidden = true;
        }
      }
      manifest.images.push({ src: url, handle, ts: m.ts, model: "pro" });
      // Lifetime render tally (for the credit/usage estimate in /wall-admin).
      manifest.rendered = manifest.rendered || { pro: 0, flash: 0 };
      manifest.rendered.pro++;
      // Post the finished portrait to the DISPLAY channel (RENDER_POST_CHANNEL)
      // so the public photobooth shows only renders; the raw selfie stays in
      // the intake channel (HEADSHOT_SLACK_CHANNEL) that the pipeline reads.
      // Falls back to the intake channel if no separate display channel is set.
      // @mention if we know who, generic if not. DM only with a user id.
      const postChannel = process.env.RENDER_POST_CHANNEL || channel;
      await postPortraitToChannel(postChannel, uid ?? null, url, token);
      if (uid) await dmPortrait(uid, url, token);
      processed++;
      newLastTs = m.ts;                 // advance only on success
      delete manifest.attempts[m.ts];
    } catch (e) {
      const msg = String(e);
      // Transient = Pro overloaded/busy/network. Keep the snap queued and retry
      // every run (Pro only) until it succeeds.
      const transient = /\b(429|500|503)\b|high demand|overload|unavailable|rate limit|timeout|ETIMEDOUT|ECONN|fetch failed/i.test(msg);
      if (transient) {
        const n = (manifest.attempts[m.ts] ?? 0) + 1;
        manifest.attempts[m.ts] = n;
        errors.push(`${m.ts} (transient try ${n}): ${msg.slice(0, 90)}`);
        // Don't let one stuck snap block the whole queue. After many transient
        // retries (a "poison" image that keeps erroring, or a long Pro outage),
        // skip past it so newer snaps keep rendering — the queue self-heals.
        const TRANSIENT_MAX = 12;
        if (n >= TRANSIENT_MAX) { newLastTs = m.ts; delete manifest.attempts[m.ts]; continue; }
        break; // otherwise retry oldest-first on the next run
      }
      // Terminal (bad image, malformed response): give up after a few tries so
      // it can't block the queue.
      const n = (manifest.attempts[m.ts] ?? 0) + 1;
      manifest.attempts[m.ts] = n;
      errors.push(`${m.ts} (terminal try ${n}): ${msg.slice(0, 120)}`);
      if (n >= MAX_ATTEMPTS) { newLastTs = m.ts; continue; } // give up, move past it
      break;
    }
  }

  manifest.lastTs = newLastTs;
  manifest.images = manifest.images.slice(-400);
  try { await writeManifest(manifest); } catch (e) { errors.push(`write: ${String(e).slice(0, 120)}`); }

  return NextResponse.json({ processed, total: manifest.images.length, lastTs: manifest.lastTs, errors });
}
