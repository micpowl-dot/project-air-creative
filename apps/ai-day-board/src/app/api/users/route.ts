// Workspace directory for the /snap typeahead. Pulls the full member list via
// Slack users.list (bot has users:read), caches it on the warm instance for an
// hour (the directory rarely changes), and serves a slim searchable list.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DirUser {
  id: string;
  name: string; // display name (or real name fallback)
  real: string;
  handle: string; // Slack username
}

let cache: { at: number; users: DirUser[] } | null = null;
const TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const token = process.env.WALL_SLACK_TOKEN;
  if (!token) return NextResponse.json({ users: [] });

  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json({ users: cache.users });
  }

  const users: DirUser[] = [];
  let cursor = "";
  let complete = true; // did we page all the way through without a Slack error?
  try {
    do {
      const url = `https://slack.com/api/users.list?limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const body = await res.json();
      if (!body.ok) { complete = false; break; } // rate-limited / error mid-pagination
      for (const m of body.members ?? []) {
        if (m.deleted || m.is_bot || m.id === "USLACKBOT") continue;
        const p = m.profile ?? {};
        const name = (p.display_name || p.real_name || m.name || "").trim();
        if (!name) continue;
        users.push({ id: m.id, name, real: (p.real_name || "").trim(), handle: m.name || "" });
      }
      cursor = body.response_metadata?.next_cursor || "";
    } while (cursor);
  } catch {
    complete = false;
  }

  users.sort((a, b) => a.name.localeCompare(b.name));
  // Only cache a COMPLETE directory. A partial fetch (Slack rate limit) must not
  // poison the typeahead for an hour and leave people unable to find their name
  // — keep serving the last good cache, and let the next request retry.
  if (complete && users.length) {
    cache = { at: Date.now(), users };
    return NextResponse.json({ users });
  }
  if (cache?.users.length) return NextResponse.json({ users: cache.users }); // last good
  return NextResponse.json({ users }); // best effort, uncached → next call retries
}
