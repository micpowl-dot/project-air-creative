// Serve wall portraits from our own origin instead of pointing browsers at
// raw.githubusercontent.com.
//
// Why: the wall renders every tile twice for the seamless loop, so one screen
// load fired ~226 image requests at GitHub in a burst. Across three offices plus
// desk viewers, GitHub started answering 429 and 502 and tiles rendered broken.
// Nothing was missing — the same files return 200 when asked for individually.
//
// Going through here means Vercel's CDN caches each portrait at the edge and
// GitHub is hit once per file, ever, instead of hundreds of times an hour.
//
// Deliberately reachable without a key (see proxy.ts). These exact bytes are
// already served unauthenticated from a public GitHub URL, so this changes
// nothing about exposure — and it means the signage players, which do not keep
// cookies, can load images without any token plumbing.

import { NextResponse } from "next/server";

const REPO = () => process.env.GITHUB_REPO || "micpowl-dot/project-air-creative";
const BRANCH = () => process.env.GITHUB_BRANCH || "ai-day-board-v1";
const BASE = "apps/ai-day-board/public/wall-generated";

// Filenames are generated from a Slack message timestamp, sometimes with a short
// suffix. Anything else is rejected rather than passed upstream, so this can never
// be walked out of the wall-generated directory or turned into an open proxy.
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.png$/;

export async function GET(_request: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!SAFE.test(file) || file.includes("..")) {
    return NextResponse.json({ error: "bad filename" }, { status: 400 });
  }

  const upstream = `https://raw.githubusercontent.com/${REPO()}/${BRANCH()}/${BASE}/${file}`;
  let res: Response;
  try {
    res = await fetch(upstream, { cache: "no-store" });
  } catch {
    return new NextResponse("upstream unreachable", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  if (!res.ok) {
    // Never cache a failure: a transient GitHub 429 must not be pinned at the edge
    // for a year. The next request retries.
    return new NextResponse(`upstream ${res.status}`, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  const body = Buffer.from(await res.arrayBuffer());
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/png",
      // Safe to pin hard: a portrait's filename is unique to that render, and a
      // re-render gets a new filename, so the bytes behind a URL never change.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
