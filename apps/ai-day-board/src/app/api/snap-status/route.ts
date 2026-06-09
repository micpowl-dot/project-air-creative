// Public, lightweight status for the /snap photo booth. /snap polls this to
// know whether to show the "back shortly" pause overlay. Cached briefly so a
// crowd of phones doesn't hammer the GitHub manifest read.
export const dynamic = "force-dynamic";

let cache: { at: number; paused: boolean } | null = null;
const TTL = 10 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return Response.json({ paused: cache.paused });
  }
  try {
    const { readManifest } = await import("@/lib/wall-store");
    const m = await readManifest();
    // Default to PAUSED until the admin explicitly reopens (?? only falls back
    // on undefined, so an explicit false keeps the booth open). Fail-safe: a
    // missing manifest also reads as paused.
    const paused = m?.paused ?? true;
    cache = { at: Date.now(), paused };
    return Response.json({ paused });
  } catch {
    // On error, keep the last known value (default open).
    return Response.json({ paused: cache?.paused ?? false });
  }
}
