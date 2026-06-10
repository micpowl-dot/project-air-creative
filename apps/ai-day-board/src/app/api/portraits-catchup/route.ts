// Hourly bot-side catch-up: DM (from the AI Day Wall bot) anyone on the wall
// who hasn't been covered yet — mainly free-text-name participants who don't
// get the per-snap auto-DM (no Slack id at snap time). Idempotent via
// manifest.sentPortraits, plus a SEED of everyone already DM'd from Michael's
// account + the per-snap auto-DMs (recorded by process-photos), so nobody is
// doubled. Cron-reachable (not under /api/wall-admin, so no Basic-Auth gate);
// optionally guarded by CRON_SECRET.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BATCH = 30; // hourly; plenty for the trickle of stragglers

// Already DM'd from Michael's account (one-time backlog send) + Michael himself.
// Union'd with manifest.sentPortraits so the catch-up never re-sends these.
const SEED = new Set<string>([
  "U06EQ2E7J6R", // Michael (sender)
  "U06ECC3H1D5","U06ECC6RRMM","U06ECC7T1AT","U06ECCP0ZJB","U06ECCTEL7R","U06ECCZ7Z1D","U06ECDDN095","U06EL9TQL4W","U06ELA9GAR4","U06ELAHUAUE",
  "U06ELAJCBP0","U06ELB6GFJA","U06ELBBLJR4","U06ELBCMC30","U06EQ12PYKF","U06EQ16L5HB","U06EQ1XUKN1","U06EQ20G95K","U06EQ26SWAH","U06EQ2NNZHT",
  "U06EQ2ZBAMT","U06EQ2ZDD9T","U06EQ2ZQ161","U06ESRJMF27","U06EST77RB5","U06ESV58074","U06ET00AEG2","U06ET0BG6D8","U06ET11L1TL","U06ET14676E",
  "U06EVD7SKL4","U06EVDA1PL4","U06EVE9DC3W","U06F11LKM9C","U06F5HNN58R","U06F5JBQWSV","U06F5KH1T0R","U06F5KJ13J5","U06F5KKL3PT","U06F5KLRJLR",
  "U06FFMW0WU8","U06FFN17FGQ","U06FFN790NL","U06FFNCT55W","U06FFNN3PSL","U06FFNXRYSC","U06FFNY89LY","U06FFPXCQU8","U06FFPXDSCQ","U06FFPY7D3J",
  "U06H8AJ26TU","U06J7UAAF7H","U06N8NYS04W","U06PVEZEV3R","U06Q3C22DEJ","U070Q960M6W","U07CREALKM1","U07DVLCSBJR","U07LRFS53M5","U07NT7QADK3",
  "U07P5VALXJQ","U07R4AA5XHP","U080B0ZU05V","U0810RPC08Y","U08708MESBE","U08AL9WBJTH","U08MN3FLS93","U08QP09JUAY","U095EBZS0U9","U09AX520E9H",
  "U09DZGU88EL","U09JF4QE4GK","U09Q0B41R6C","U0A1DGFAA9H","U0A5J5PD717","U0A5Q754TJ5","U0ABPUU6NS2","U0AFRQW8AKU","U0ASB9QCUTD","U0B638N8J03",
]);

function normName(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = process.env.WALL_SLACK_TOKEN;
  if (!token) return NextResponse.json({ skipped: "no token" });
  const origin = new URL(request.url).origin;

  // Wall set + directory.
  let wallImages: { src: string; handle?: string }[] = [];
  let dir: { id: string; name: string; handle: string }[] = [];
  try {
    const [w, u] = await Promise.all([
      fetch(`${origin}/api/wall`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`${origin}/api/users`, { cache: "no-store" }).then((r) => r.json()),
    ]);
    wallImages = Array.isArray(w.images) ? w.images : [];
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

  // Resolve recipients not yet covered.
  const seen = new Set<string>();
  const pending: { userId: string; src: string }[] = [];
  for (const img of wallImages) {
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
