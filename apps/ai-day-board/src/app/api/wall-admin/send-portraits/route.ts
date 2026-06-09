// Admin-only: DM everyone on the wall their portrait via Slack.
//   POST { dryRun: true }  -> preview: counts only, sends nothing.
//   POST { }               -> sends the next paced batch; call repeatedly until done.
//   POST { reset: true }   -> clears the "already sent" record (start over).
//
// Recipients = the exact set shown on /wall (live renders + speaker cutouts,
// deduped by person), resolved to Slack users via the directory. Anonymous /
// unmatched names are skipped. Idempotent: each person is recorded once sent,
// so repeated calls (the admin loop) never double-DM. Gated by the admin
// password via src/proxy.ts.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BATCH = 8; // DMs per call; the admin UI loops until done (paced ~1/sec)

function normName(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

export async function POST(request: Request) {
  let dryRun = false, reset = false;
  try {
    ({ dryRun = false, reset = false } = await request.json());
  } catch {
    /* defaults */
  }

  const token = process.env.WALL_SLACK_TOKEN;
  if (!token) return NextResponse.json({ error: "no token" }, { status: 503 });
  const origin = new URL(request.url).origin;

  // 1) Exactly what's on the wall (live renders + speakers, deduped) — reuse /api/wall.
  let wallImages: { src: string; handle?: string }[] = [];
  try {
    const w = await fetch(`${origin}/api/wall`, { cache: "no-store" }).then((r) => r.json());
    wallImages = Array.isArray(w.images) ? w.images : [];
  } catch {
    return NextResponse.json({ error: "could not read the wall" }, { status: 502 });
  }

  // 2) Directory: map handle + normalized name -> Slack user id.
  let dir: { id: string; name: string; handle: string }[] = [];
  try {
    const u = await fetch(`${origin}/api/users`, { cache: "no-store" }).then((r) => r.json());
    dir = Array.isArray(u.users) ? u.users : [];
  } catch {
    /* leave empty -> everything unmatched */
  }
  const byKey = new Map<string, string>();
  for (const d of dir) {
    if (d.handle) byKey.set(d.handle.toLowerCase(), d.id);
    if (d.name) byKey.set(normName(d.name), d.id);
  }

  // 3) Resolve recipients (dedupe by person; skip anonymous + unmatched).
  const seen = new Set<string>();
  const recipients: { handle: string; userId: string; src: string }[] = [];
  const unmatched: string[] = [];
  for (const img of wallImages) {
    const h = (img.handle || "").trim();
    if (!h) continue; // anonymous selfie — no one to DM
    const key = h.replace(/^@/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const userId = byKey.get(key);
    if (!userId) { unmatched.push(h); continue; }
    const src = img.src.startsWith("http") ? img.src : `${origin}${img.src}`; // speakers use a relative path
    recipients.push({ handle: h, userId, src });
  }

  const { readManifest, writeManifest } = await import("@/lib/wall-store");
  const manifest = await readManifest();
  if (!manifest) return NextResponse.json({ error: "manifest unavailable" }, { status: 503 });
  if (reset) { manifest.sentPortraits = []; await writeManifest(manifest); }
  const sent = new Set(manifest.sentPortraits ?? []);
  const pending = recipients.filter((r) => !sent.has(r.userId));

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      total: recipients.length,
      alreadySent: recipients.length - pending.length,
      pending: pending.length,
      unmatched: unmatched.length,
      unmatchedSample: unmatched.slice(0, 25),
    });
  }

  // Send the next paced batch.
  const batch = pending.slice(0, BATCH);
  let sentNow = 0;
  const errors: string[] = [];
  for (const r of batch) {
    try {
      const open = await fetch("https://slack.com/api/conversations.open", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ users: r.userId }),
      }).then((x) => x.json());
      const channel = open.ok ? open.channel?.id : null;
      if (!channel) { errors.push(`${r.handle}: open ${open.error}`); continue; }

      const heading = "🎉 Here's your AI Day portrait!";
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          text: heading,
          blocks: [
            { type: "section", text: { type: "mrkdwn", text: `${heading}\nThanks for being part of AI Day. Here's your illustrated portrait from the wall — feel free to use it however you like.` } },
            { type: "image", image_url: r.src, alt_text: "Your AI Day portrait" },
          ],
        }),
      }).then((x) => x.json());
      if (!res.ok) { errors.push(`${r.handle}: post ${res.error}`); continue; }

      sent.add(r.userId);
      sentNow++;
      await new Promise((z) => setTimeout(z, 1100)); // pace ~1 msg/sec
    } catch (e) {
      errors.push(`${r.handle}: ${String(e).slice(0, 60)}`);
    }
  }
  manifest.sentPortraits = [...sent];
  await writeManifest(manifest);

  const remaining = pending.length - sentNow;
  return NextResponse.json({ sentNow, totalSent: sent.size, remaining, done: remaining <= 0, errors: errors.slice(0, 10) });
}
