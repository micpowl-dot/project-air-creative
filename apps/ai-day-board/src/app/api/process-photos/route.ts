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
import { stylize, randomBg, STANDARD_MODEL, STYLE_REFS } from "@/lib/stylize-core";
import { readManifest, writeManifest, putImage, type WallManifest } from "@/lib/wall-store";
import { dmPortrait } from "@/lib/portrait-dm";
import { sweepPendingDms, sweepDeactivated } from "@/lib/wall-upkeep";
import { SENT_SEED } from "@/lib/sent-seed";

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

  // readManifest() returns null on a TRANSIENT read failure (rate limit, network,
  // a momentary non-200 from GitHub) as well as a genuine 404. We must NOT write a
  // fresh empty manifest here: doing so overwrites the real manifest whenever a read
  // merely blips, which silently wiped all 105 images on 2026-06-16. Skip the run
  // instead and leave whatever is there untouched. The manifest is seeded/restored
  // out of band; it is never auto-created from this path.
  if (!manifest) {
    return NextResponse.json({ skipped: "manifest unavailable; not overwriting" }, { status: 200 });
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
  // Diverse style references (fetched once, reused for the whole batch).
  const styleParts = await Promise.all(
    STYLE_REFS.map(async (slug) => ({ mimeType: "image/png", data: await fetchB64(`${origin}/headshots/cutout/${slug}.png`) }))
  );

  let processed = 0;
  let newLastTs = manifest.lastTs;
  const errors: string[] = [];
  const MAX_ATTEMPTS = 3; // give up only on TERMINAL failures (bad image, etc.) after this many
  manifest.attempts = manifest.attempts || {};

  for (const m of msgs as { ts: string; user: string; text?: string; files: { name?: string; mimetype?: string; url_private?: string; url_private_download?: string }[] }[]) {
    if (processed >= MAX_PER_RUN) break;
    const file = m.files.find((f) => String(f.mimetype || "").startsWith("image/"));
    if (!file) { newLastTs = m.ts; continue; } // non-image: skip past permanently
    // Pro first (best likeness). If Pro is at its rate/daily cap, fall back to
    // Flash so the portrait still renders during the event — Pro resumes
    // automatically once its daily quota resets.
    try {
      const dl = await fetch(file.url_private_download || file.url_private || "", { headers: { Authorization: `Bearer ${token}` } });
      const personData = Buffer.from(await dl.arrayBuffer()).toString("base64");
      const bg = randomBg();
      const bgData = await fetchB64(`${origin}/headshots/bg/${bg}.png`);
      const styleArgs = {
        apiKey,
        styles: styleParts,
        person: { mimeType: file.mimetype || "image/jpeg", data: personData },
        background: { mimeType: "image/png", data: bgData },
      };
      let out: string;
      let usedModel: "pro" | "flash" = "pro";
      try {
        out = await stylize(styleArgs);
      } catch (proErr) {
        // Pro can fail for several reasons: a 429/quota cap, OR the preview model
        // being retired/unavailable (a "gemini-3-pro-image-preview" 404 stranded
        // snaps on 2026-06-30). Fall back to the stable Flash model on ANY Pro
        // error so the portrait still renders. If Flash also fails, it propagates
        // to the transient/terminal handling below.
        errors.push(`pro->flash (${String(proErr).slice(0, 80)})`);
        out = await stylize({ ...styleArgs, model: STANDARD_MODEL });
        usedModel = "flash";
      }
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
      let handle = uid ? await resolveHandle(uid, token) : "";
      if (!handle) {
        // Free-text submission (no Slack id): caption with the name the person
        // typed, parsed from the post comment "📸 NAME using the AI Day Me app".
        const nm = (m.text || "").match(/📸\s+(.+?)\s+using the AI Day Me app/);
        if (nm && nm[1] && nm[1].trim().toLowerCase() !== "someone") handle = nm[1].trim();
      }
      // One image per tagged person ON THE WALL: hide (don't delete) any earlier
      // render for this handle so only the latest is active. Prior versions stay
      // in /wall-admin, grayed out, and can be re-activated by tapping them.
      // (Anonymous snaps have no handle, so they're never deduped against.)
      if (handle) {
        for (const i of manifest.images) {
          if ((i.handle || "") === handle) i.hidden = true;
        }
      }
      manifest.images.push({ src: url, handle, ts: m.ts, model: usedModel, srcUrl: file.url_private, uid });
      // Lifetime render tally (for the credit/usage estimate in /wall-admin).
      manifest.rendered = manifest.rendered || { pro: 0, flash: 0 };
      manifest.rendered[usedModel]++;
      // Post the finished portrait to the DISPLAY channel (RENDER_POST_CHANNEL)
      // so the public photobooth shows only renders; the raw selfie stays in
      // the intake channel (HEADSHOT_SLACK_CHANNEL) that the pipeline reads.
      // Falls back to the intake channel if no separate display channel is set.
      // @mention if we know who, generic if not. DM only with a user id.
      const postChannel = process.env.RENDER_POST_CHANNEL || channel;
      await postPortraitToChannel(postChannel, uid ?? null, url, token);
      // Only auto-DM Pro-quality portraits, and NEVER anyone already covered.
      // alreadySent = the backlog SEED (DM'd from Michael's account) UNION every
      // prior auto-DM recorded in the manifest. If we fell back to Flash (Pro
      // quota capped), skip the DM and DON'T mark them sent. Guarantees no one
      // is ever DM'd twice, including the 80 backlog recipients.
      // Guard on the RENDER, not the person. The old per-person check meant
      // anyone who took part in June could never be DMed again, so when the
      // all-company post on 2026-08-06 invited everyone back for "a fresh,
      // futuristic redo" and told them to watch their DMs, Javi Quiñones, Jay Lee
      // and Rita Wood submitted, landed on the wall, and received nothing.
      //
      // Renders from before the August run keep the old protection, so replaying
      // old messages can never spam the June cohort a second time.
      manifest.sentPortraits = manifest.sentPortraits || [];
      manifest.sentRenders = manifest.sentRenders || [];
      const AUGUST_RUN_FROM = 1785000000; // 2026-07-24; anything newer is this run
      const thisRun = Number(m.ts) > AUGUST_RUN_FROM;
      const legacyBlocked = new Set<string>([...SENT_SEED, ...manifest.sentPortraits]);
      const alreadyDone = thisRun
        ? manifest.sentRenders.includes(m.ts)
        : !uid || legacyBlocked.has(uid);
      // Flash renders are DMed too. Skipping them meant that whenever Pro hit its
      // quota, people got a portrait on the wall and silence in their DMs, with
      // nothing recorded, so it could never be put right.
      if (uid && !alreadyDone) {
        const delivered = await dmPortrait(uid, url, token);
        // Only record a DM that actually landed. Recording a failure marked the
        // portrait as sent forever and the person never heard anything.
        if (delivered) {
          manifest.sentRenders.push(m.ts);
          if (!manifest.sentPortraits.includes(uid)) manifest.sentPortraits.push(uid);
        } else {
          errors.push(`${m.ts}: DM to ${uid} failed, left for the sweep`);
        }
      }
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
        // A GLOBAL outage (quota/429, or 503 overload) hits every snap and
        // recovers later — never skip past those, or we'd silently drop every
        // queued photo during the outage. Keep them queued so they all render
        // once capacity returns. Only skip a per-image "poison" snap (e.g. a
        // 500 on one bad image) after many tries so it can't block the queue.
        const globalOutage = /\b(429|503)\b|quota|rate limit|overload|high demand|unavailable/i.test(msg);
        const TRANSIENT_MAX = 12;
        if (!globalOutage && n >= TRANSIENT_MAX) { newLastTs = m.ts; delete manifest.attempts[m.ts]; continue; }
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

  // Upkeep, folded in because its own cron never fired. Wrapped so neither task can
  // fail a render run, and both mutate the manifest we are about to write anyway, so
  // there is exactly one writer and no clobbering between jobs.
  let dmSweep = null;
  let leavers = null;
  try {
    dmSweep = await sweepPendingDms(manifest, token);
    leavers = await sweepDeactivated(manifest, token);
  } catch (e) {
    errors.push(`upkeep: ${String(e).slice(0, 120)}`);
  }

  try { await writeManifest(manifest); } catch (e) { errors.push(`write: ${String(e).slice(0, 120)}`); }

  return NextResponse.json({
    processed,
    total: manifest.images.length,
    lastTs: manifest.lastTs,
    dmSweep,
    leavers,
    errors,
  });
}
