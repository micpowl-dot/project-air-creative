// Hide portraits belonging to people who have left, on a schedule.
//
// Until now this was manual: Sara Peal, Lauren Fucci, Lucia Sabo and Jessica Renz
// were each taken off the wall by hand. Nothing was watching in between, so the
// guarantee only held as long as someone remembered to check.
//
// Checks Slack's `deleted` flag via users.info, which needs only the uid stored on
// each render. Handle text is never used to decide: two people can share a name,
// and the wall showing the wrong person's face is worse than a leaver lingering an
// extra few hours.
//
// SAFETY RULES:
//  1. Hide only on a definite deleted=true. A failed or ambiguous lookup changes
//     nothing, so a Slack outage can never blank the wall.
//  2. MAX_HIDES_PER_RUN caps the damage of any bad state.
//  3. LOOKUP_BUDGET bounds the API calls; entries rotate by least-recently-checked
//     so everyone is covered over a day without hammering Slack.
//  4. Nothing is ever un-hidden. Re-activating a portrait stays a human decision
//     in /wall-admin.

import { NextResponse } from "next/server";
import { readManifest, writeManifest } from "@/lib/wall-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const LOOKUP_BUDGET = 25;
const MAX_HIDES_PER_RUN = 5;

async function isDeactivated(uid: string, token: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const b = await res.json();
    if (!b.ok || !b.user) return null; // unknown, not "fine" and not "gone"
    return Boolean(b.user.deleted);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = process.env.WALL_SLACK_TOKEN;
  if (!token) return NextResponse.json({ skipped: "no WALL_SLACK_TOKEN" });

  const manifest = await readManifest();
  if (!manifest) return NextResponse.json({ skipped: "manifest unavailable" });

  // Visible booth portraits that carry a uid, least-recently-checked first.
  const candidates = manifest.images
    .filter((i) => !i.hidden && !String(i.src).startsWith("/") && i.uid)
    .sort((a, b) => (a.checkedAt || 0) - (b.checkedAt || 0))
    .slice(0, LOOKUP_BUDGET);

  const now = Date.now();
  const hidden: string[] = [];
  const unknown: string[] = [];
  let checked = 0;

  for (const img of candidates) {
    if (hidden.length >= MAX_HIDES_PER_RUN) break;
    const gone = await isDeactivated(String(img.uid), token);
    checked++;
    if (gone === null) {
      unknown.push(img.handle || String(img.uid));
      continue; // leave checkedAt alone so it is retried first next run
    }
    img.checkedAt = now;
    if (gone) {
      img.hidden = true;
      hidden.push(img.handle || String(img.uid));
    }
  }

  try {
    await writeManifest(manifest);
  } catch (e) {
    return NextResponse.json({ checked, hidden, unknown, error: "could not save", detail: String(e).slice(0, 200) });
  }

  const remaining = manifest.images.filter(
    (i) => !i.hidden && !String(i.src).startsWith("/") && i.uid && (i.checkedAt || 0) < now
  ).length;

  return NextResponse.json({ checked, hidden, unknown, stillToCheck: remaining });
}
