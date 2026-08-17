// Upkeep that used to live in its own cron routes, folded into the render cron.
//
// Why folded: /api/portrait-sweep was declared in vercel.json for ten days and
// never fired once, so the catch-up it was meant to provide did not exist. Rather
// than keep adding jobs and hoping, both tasks now run inside /api/process-photos,
// which demonstrably fires every minute.
//
// Two side benefits. There is only one writer of the manifest, so two crons can no
// longer clobber each other's changes; and both tasks share the read and the write
// the render cron was already doing.
//
// Neither function does its own I/O on the manifest. They mutate the object and
// let the caller write once.

import type { WallManifest } from "./wall-store";
import { dmPortrait } from "./portrait-dm";

/** Renders newer than this belong to the August run. Older ones were handled by
 *  hand in June and must never be messaged again. */
const RUN_STARTED = 1785000000; // 2026-07-24

/** Bounded so a bad state can never turn into a wall of Slack messages. */
const MAX_DMS_PER_RUN = 3;

/**
 * When sentRenders became the authoritative record (this fold shipping).
 *
 * Anything rendered BEFORE this was DMed by the old code, which recorded only the
 * PERSON in sentPortraits, not the render. So for older renders that per-person
 * record is the only evidence a DM went out, and it has to be honoured.
 *
 * This guard was missing on the first deploy and it cost 8 people a duplicate:
 * backfilling uid onto historical entries made them eligible for the sweep, and
 * "carries a uid" had been quietly doing the job of "is recent". Two protections
 * that looked independent were the same one.
 */
const SENT_RENDERS_AUTHORITATIVE_FROM = 1786982400; // 2026-08-17T16:00:00Z

/** How often the leaver check runs. Every minute would be 25 Slack calls a minute
 *  for no reason; deactivations are not urgent. */
const DEACTIVATION_INTERVAL_MS = 30 * 60 * 1000;
const LOOKUP_BUDGET = 25;
const MAX_HIDES_PER_RUN = 5;

const isBooth = (src: unknown) => !String(src).startsWith("/");

/**
 * DM anyone whose portrait is up but who never received it.
 *
 * Covers the gaps the render path can still leave: a transient Slack failure, or a
 * render that landed while the DM step was failing. Only renders carrying a uid are
 * eligible, so this cannot reach back into pre-August history.
 */
export async function sweepPendingDms(
  manifest: WallManifest,
  token: string
): Promise<{ delivered: string[]; failed: string[]; pending: number }> {
  manifest.sentRenders = manifest.sentRenders || [];
  manifest.sentPortraits = manifest.sentPortraits || [];
  const sent = new Set(manifest.sentRenders);

  const alreadyByPerson = new Set(manifest.sentPortraits);
  const pending = manifest.images.filter((i) => {
    if (i.hidden || !isBooth(i.src) || !i.uid || !i.ts) return false;
    if (Number(i.ts) <= RUN_STARTED) return false;      // June, handled by hand
    if (sent.has(String(i.ts))) return false;           // this render already went
    // Older render: the per-person record is the only proof we have, so trust it.
    if (Number(i.ts) < SENT_RENDERS_AUTHORITATIVE_FROM && alreadyByPerson.has(String(i.uid))) return false;
    return true;
  });

  const delivered: string[] = [];
  const failed: string[] = [];
  for (const img of pending.slice(0, MAX_DMS_PER_RUN)) {
    const ok = await dmPortrait(String(img.uid), String(img.src), token);
    if (ok) {
      manifest.sentRenders.push(String(img.ts));
      if (!manifest.sentPortraits.includes(String(img.uid))) manifest.sentPortraits.push(String(img.uid));
      delivered.push(img.handle || String(img.uid));
    } else {
      // Left pending on purpose: a failure must not be recorded as delivered.
      failed.push(img.handle || String(img.uid));
    }
  }
  return { delivered, failed, pending: pending.length };
}

async function isDeactivated(uid: string, token: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const b = await res.json();
    if (!b.ok || !b.user) return null; // unknown: neither present nor gone
    return Boolean(b.user.deleted);
  } catch {
    return null;
  }
}

/**
 * Hide portraits of people who have left.
 *
 * Decides on the stored uid, never on handle text: two people can share a name and
 * hiding the wrong person's face is worse than a leaver lingering an extra half
 * hour. Hides only on a definite deleted=true, so a Slack outage cannot blank the
 * wall, and never un-hides anything — re-activating stays a human call in
 * /wall-admin.
 */
export async function sweepDeactivated(
  manifest: WallManifest,
  token: string
): Promise<{ ran: boolean; checked: number; hidden: string[]; unknown: string[] }> {
  const now = Date.now();
  const last = manifest.lastDeactivationSweep || 0;
  if (now - last < DEACTIVATION_INTERVAL_MS) {
    return { ran: false, checked: 0, hidden: [], unknown: [] };
  }
  manifest.lastDeactivationSweep = now;

  const candidates = manifest.images
    .filter((i) => !i.hidden && isBooth(i.src) && i.uid)
    .sort((a, b) => (a.checkedAt || 0) - (b.checkedAt || 0))
    .slice(0, LOOKUP_BUDGET);

  const hidden: string[] = [];
  const unknown: string[] = [];
  let checked = 0;

  for (const img of candidates) {
    if (hidden.length >= MAX_HIDES_PER_RUN) break;
    const gone = await isDeactivated(String(img.uid), token);
    checked++;
    if (gone === null) {
      // Leave checkedAt alone so this entry is retried first next time.
      unknown.push(img.handle || String(img.uid));
      continue;
    }
    img.checkedAt = now;
    if (gone) {
      img.hidden = true;
      hidden.push(img.handle || String(img.uid));
    }
  }
  return { ran: true, checked, hidden, unknown };
}
