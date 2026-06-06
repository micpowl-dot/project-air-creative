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
  try {
    do {
      const url = `https://slack.com/api/users.list?limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const body = await res.json();
      if (!body.ok) break;
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
    /* serve whatever we collected */
  }

  users.sort((a, b) => a.name.localeCompare(b.name));
  cache = { at: Date.now(), users };
  return NextResponse.json({ users });
}
