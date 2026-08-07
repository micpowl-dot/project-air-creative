// Catch-up sweep: find anyone whose portrait is on the wall but who never got the
// DM, and send it. Runs on a cron (see vercel.json) so it works with nobody at a
// laptop.
//
// This exists because five people were left with nothing after the 2026-08-06
// all-company post told everyone to watch their DMs. The render cron now DMs
// correctly, but a DM can still fail transiently, and a miss is otherwise silent.
//
// ANTI-BARRAGE RULES, all deliberate:
//  1. Only the person's CURRENT portrait. Retakes are hidden in the manifest and
//     never swept, so someone who submitted five times gets one DM, not five.
//  2. Only renders carrying a stored uid. The uid is recorded at render time, so
//     the sweep structurally cannot reach back to older history.
//  3. Only renders from this run.
//  4. Skip anything already in sentRenders — the per-render record, not the
//     per-person one, which is what made people permanently unreachable before.
//  5. MAX_PER_SWEEP caps a single run. Even in a pathological state, the worst
//     case is a handful of messages, never everybody at once.
//  6. Record only what Slack confirmed. A failed DM stays pending for next time
//     rather than being marked delivered.

import { NextResponse } from "next/server";
import { readManifest, writeManifest } from "@/lib/wall-store";
import { dmPortrait } from "@/lib/portrait-dm";

export const dynamic = "force-dynamic";

// Renders newer than this belong to the August run. Older ones are never swept:
// their recipients were handled by hand in June and must not be messaged again.
const RUN_STARTED = 1785000000; // 2026-07-24

// The single most important number here. Submissions arrive a few an hour, so five
// per half-hourly run clears any real backlog quickly while making a runaway
// impossible.
const MAX_PER_SWEEP = 5;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = process.env.WALL_SLACK_TOKEN;
  if (!token) return NextResponse.json({ skipped: "no WALL_SLACK_TOKEN" });

  const manifest = await readManifest();
  // A transient read failure must not be mistaken for "nothing pending".
  if (!manifest) return NextResponse.json({ skipped: "manifest unavailable" });

  manifest.sentRenders = manifest.sentRenders || [];
  manifest.sentPortraits = manifest.sentPortraits || [];
  const sent = new Set(manifest.sentRenders);

  const pending = manifest.images.filter(
    (i) =>
      !i.hidden &&
      !String(i.src).startsWith("/") &&
      i.uid &&
      i.ts &&
      Number(i.ts) > RUN_STARTED &&
      !sent.has(String(i.ts))
  );

  const batch = pending.slice(0, MAX_PER_SWEEP);
  const delivered: string[] = [];
  const failed: string[] = [];

  for (const img of batch) {
    const ok = await dmPortrait(String(img.uid), String(img.src), token);
    if (ok) {
      manifest.sentRenders.push(String(img.ts));
      if (!manifest.sentPortraits.includes(String(img.uid))) manifest.sentPortraits.push(String(img.uid));
      delivered.push(img.handle || String(img.uid));
    } else {
      failed.push(img.handle || String(img.uid));
    }
  }

  if (delivered.length) {
    try {
      await writeManifest(manifest);
    } catch (e) {
      // The DMs went out but the record did not save, so the next sweep would
      // repeat them. Surfaced loudly rather than swallowed.
      return NextResponse.json(
        { delivered, failed, error: "sent but could not record", detail: String(e).slice(0, 200) },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({
    pending: pending.length,
    swept: batch.length,
    delivered,
    failed,
    deferred: Math.max(0, pending.length - batch.length),
  });
}
