// Hourly bot-side catch-up: DM (from the AI Day Wall bot) anyone on the wall
// who hasn't been covered yet — mainly free-text-name participants who don't
// get the per-snap auto-DM (no Slack id at snap time). Idempotent via
// manifest.sentPortraits, plus a SEED of everyone already DM'd from Michael's
// account + the per-snap auto-DMs (recorded by process-photos), so nobody is
// doubled. Cron-reachable (not under /api/wall-admin, so no Basic-Auth gate);
// optionally guarded by CRON_SECRET.
import { NextResponse } from "next/server";
import { SENT_SEED } from "@/lib/sent-seed";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BATCH = 30; // hourly; plenty for the trickle of stragglers

// Shared backlog seed (DM'd from Michael's account) + Michael himself.
// Union'd with manifest.sentPortraits so the catch-up never re-sends these.
const SEED = new Set<string>(SENT_SEED);

function normName(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

export async function GET(request: Request) {
  // HARD KILL-SWITCH. This endpoint stays OFF unless PORTRAITS_CATCHUP_ENABLED=1
  // is set in the environment. Disabled by default so no automated or leftover
  // trigger can ever DM anyone unattended. Re-enable deliberately, eyes on.
  if (process.env.PORTRAITS_CATCHUP_ENABLED !== "1") {
    return NextResponse.json({ disabled: true, note: "catch-up off by default; set PORTRAITS_CATCHUP_ENABLED=1 to enable" });
  }
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = process.env.WALL_SLACK_TOKEN;
  if (!token) return NextResponse.json({ skipped: "no token" });
  const origin = new URL(request.url).origin;

  // Directory (handle / name -> Slack id).
  let dir: { id: string; name: string; handle: string }[] = [];
  try {
    const u = await fetch(`${origin}/api/users`, { cache: "no-store" }).then((r) => r.json());
    dir = Array.isArray(u.users) ? u.users : [];
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
  const byKey = new Map<string, string>();
  for (const d of dir) {
    if (d.handle) byKey.set(d.handle.toLowerCase(), d.id);
    if (d.name) byKey.set(normName(d.name), d.id);
  }
  byKey.set("michelle.killroy", "U06EQ2ZBAMT");

  const { readManifest, writeManifest } = await import("@/lib/wall-store");
  const manifest = await readManifest();
  if (!manifest) return NextResponse.json({ error: "manifest unavailable" }, { status: 200 });
  const sent = new Set<string>([...SEED, ...(manifest.sentPortraits ?? [])]);

  // Recipients: visible manifest renders, PRO quality ONLY (skip Flash — we only
  // auto-send Pro-quality portraits; a Flash render gets picked up later once
  // it's re-rendered on Pro), not yet covered. Speakers are all in SEED already.
  const seen = new Set<string>();
  const pending: { userId: string; src: string }[] = [];
  for (const img of manifest.images) {
    if (img.hidden) continue;
    if (img.model === "flash") continue; // Pro only
    const h = (img.handle || "").trim();
    if (!h) continue;
    const key = h.replace(/^@/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const uid = byKey.get(key);
    if (!uid || sent.has(uid)) continue;
    const src = img.src.startsWith("http") ? img.src : `${origin}${img.src}`;
    pending.push({ userId: uid, src });
  }

  const batch = pending.slice(0, BATCH);
  let sentNow = 0;
  const errors: string[] = [];
  const sp = manifest.sentPortraits ?? [];
  for (const r of batch) {
    try {
      const open = await fetch("https://slack.com/api/conversations.open", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ users: r.userId }),
      }).then((x) => x.json());
      const channel = open.ok ? open.channel?.id : null;
      if (!channel) { errors.push(`${r.userId}: open ${open.error}`); continue; }
      const heading = "🎉 Here's your AI Day portrait!";
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          text: heading,
          blocks: [
            { type: "section", text: { type: "mrkdwn", text: `${heading}\nThanks for being part of AI Day — here's your illustrated portrait from the wall.` } },
            { type: "image", image_url: r.src, alt_text: "Your AI Day portrait" },
          ],
        }),
      }).then((x) => x.json());
      if (!res.ok) { errors.push(`${r.userId}: post ${res.error}`); continue; }
      sp.push(r.userId);
      sentNow++;
      await new Promise((z) => setTimeout(z, 1100));
    } catch (e) {
      errors.push(`${r.userId}: ${String(e).slice(0, 60)}`);
    }
  }
  manifest.sentPortraits = sp;
  if (sentNow) await writeManifest(manifest);
  return NextResponse.json({ sentNow, pending: pending.length, remaining: pending.length - sentNow, errors: errors.slice(0, 10) });
}
