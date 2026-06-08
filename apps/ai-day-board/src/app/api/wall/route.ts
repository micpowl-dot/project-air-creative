// Image + story feed for the "AI Helped Me..." live wall (/wall).
// The wall polls this every few seconds and adds new tiles as they arrive.
//
// PHOTOS (live): set WALL_IMAGES_URL to a JSON endpoint returning
//   { "images": ["https://.../photo1.jpg", ...] } — e.g. an n8n workflow that
//   watches the Drive intake folder. Falls back to the sample set otherwise.
//
// STORIES (live): set WALL_SLACK_TOKEN (a Slack token that can read history)
//   and WALL_SLACK_CHANNEL (the channel ID with the "AI helped me..." thread).
//   We pull recent messages and turn them into story cards. Falls back to
//   sample stories otherwise.

export const dynamic = "force-dynamic";

// Speaker / participant headshots that ALWAYS populate the wall so it looks
// full from the start. Live selfie snaps (from /snap) are merged in on top.
const SPEAKER_SLUGS = [
  "ben-papandrea", "brennan-gerster", "brian-oneil", "dan-margulies",
  "dave-de-sa", "elizabeth-martin", "erik-petersen", "jack-kreps",
  "james-baker", "james-belanger", "javi-quinones", "lauriana-gaudet",
  "matthew-drooker", "max-jacubowsky", "michelle-killroy", "miguel-gervassi",
  "rohit-agarwal", "rohit-nutalapati", "sahana-subbanna", "samantha-gates",
  "sara-peal", "shannon-king", "thomas-hinson", "tyler-steben",
];

const SPEAKER_IMAGES: WallImage[] = SPEAKER_SLUGS.map((s) => ({
  src: `/headshots/cutout/${s}.png`,
  handle: `@${s.replace(/-/g, ".")}`,
}));

const SAMPLE_STORIES = [
  { name: "Dave de Sa", text: "AI helped me turn a week of manual reporting into a 5-minute workflow." },
  { name: "Sahana Subbanna", text: "AI helped me draft, test, and ship a client integration in one afternoon." },
  { name: "Tyler Steben", text: "AI helped me make sense of a messy spreadsheet I'd been avoiding for months." },
  { name: "Lauriana Gaudet", text: "AI helped me prep for a tough conversation by role-playing it first." },
];

interface Story { name: string; text: string }

// Resolve Slack user IDs to display names, cached on the warm instance so we
// only fetch each person once (the wall polls frequently).
const nameCache = new Map<string, string>();
async function resolveName(id: string, token: string): Promise<string> {
  if (!id) return "";
  if (nameCache.has(id)) return nameCache.get(id)!;
  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const b = await res.json();
    const p = b.ok ? b.user?.profile : null;
    const name = (p?.display_name || p?.real_name || b.user?.real_name || "").trim();
    nameCache.set(id, name);
    return name;
  } catch {
    return "";
  }
}

// Server-side cache for the Slack-sourced quotes. The wall polls /api/wall
// frequently, but Slack's conversations.history is heavily rate-limited for
// newer apps — so we only actually call Slack every CACHE_TTL and serve the
// cached quotes (including the last-good set) in between.
let storiesCache: { at: number; stories: Story[] } | null = null;
const STORIES_TTL = 30 * 1000; // 30s — quick to surface new quotes; last-good is served if Slack throttles

// Pull "AI helped me..." posts from a Slack channel and turn them into cards.
async function storiesFromSlack(): Promise<Story[] | null> {
  const token = process.env.WALL_SLACK_TOKEN;
  const channel = process.env.WALL_SLACK_CHANNEL;
  if (!token || !channel) return null;

  // Serve fresh cache without hitting Slack.
  if (storiesCache && Date.now() - storiesCache.at < STORIES_TTL) {
    return storiesCache.stories.length ? storiesCache.stories : null;
  }
  try {
    // limit=15 to respect the strict per-call cap on the restricted tier.
    const res = await fetch(`https://slack.com/api/conversations.history?channel=${channel}&limit=15`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = await res.json();
    if (!body.ok || !Array.isArray(body.messages)) {
      // Rate-limited / transient: keep serving the last good set rather than
      // dropping to samples.
      return storiesCache?.stories.length ? storiesCache.stories : null;
    }
    const cand: { user: string; text: string }[] = [];
    for (const m of body.messages) {
      if (m.subtype || m.bot_id || !m.text) continue; // skip joins/bots/system
      const text = String(m.text)
        .replace(/<[^>]+>/g, "")   // strip mentions/links markup
        .replace(/\[[^\]]*\]/g, "") // strip [bracketed notes] meant for chat readers, not the wall
        .replace(/\s{2,}/g, " ")
        .trim();
      if (text.length < 8 || text.length > 240) continue;
      cand.push({ user: m.user, text });
    }
    // Only real testimonials: contains "helped" (the prompted phrasing) or
    // starts with "AI ...". Never fall back to arbitrary channel chatter —
    // if there are no matches we return nothing and the curated samples show.
    const helped = cand.filter((s) => /helped/i.test(s.text) || /^ai\b/i.test(s.text.trim()));
    const chosen = helped.slice(0, 40).reverse();
    // Resolve author names (cached).
    const out: Story[] = [];
    for (const c of chosen) out.push({ name: await resolveName(c.user, token), text: c.text });
    storiesCache = { at: Date.now(), stories: out };
    return out.length ? out : null;
  } catch {
    return storiesCache?.stories.length ? storiesCache.stories : null;
  }
}

interface WallImage { src: string; handle?: string }

// Primary: generated headshots from the Blob manifest (written by /api/process-photos).
// Cache the manifest-derived images. The wall polls every ~8s and reads the
// manifest from the GitHub API — without this, that burns the GitHub rate
// limit fast (especially with multiple screens open). 30s is plenty fresh.
let imagesCache: { at: number; images: WallImage[] } | null = null;
const IMAGES_TTL = 30 * 1000;

async function imagesFromBlob(): Promise<WallImage[] | null> {
  if (imagesCache && Date.now() - imagesCache.at < IMAGES_TTL) {
    return imagesCache.images.length ? imagesCache.images : null;
  }
  try {
    const { readManifest } = await import("@/lib/wall-store");
    const m = await readManifest();
    if (!m || !m.images.length) return imagesCache?.images.length ? imagesCache.images : null;
    const visible = m.images.filter((i) => !i.hidden).map(({ src, handle }) => ({ src, handle }));
    imagesCache = { at: Date.now(), images: visible };
    return visible.length ? visible : null;
  } catch {
    // On a GitHub error/rate-limit, keep serving the last good set.
    return imagesCache?.images.length ? imagesCache.images : null;
  }
}

// Fallback: a WALL_IMAGES_URL endpoint (n8n/Drive, or old path).
async function imagesFromUrl(): Promise<WallImage[] | null> {
  const liveUrl = process.env.WALL_IMAGES_URL;
  if (!liveUrl) return null;
  try {
    const res = await fetch(liveUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    if (!Array.isArray(body.images)) return null;
    return body.images
      .map((it: unknown) =>
        typeof it === "string" ? { src: it } : it && typeof it === "object" && "src" in it ? (it as WallImage) : null
      )
      .filter(Boolean) as WallImage[];
  } catch {
    return null;
  }
}

export async function GET() {
  const [blobImages, urlImages, slackStories] = await Promise.all([
    imagesFromBlob(),
    imagesFromUrl(),
    storiesFromSlack(),
  ]);
  const liveImages = blobImages ?? urlImages ?? [];
  // One image per person: if someone has a live snap, drop their static speaker
  // headshot so the live portrait replaces it (no duplicate of the same person).
  const liveHandles = new Set(liveImages.map((i) => (i.handle || "").toLowerCase()).filter(Boolean));
  const speakers = SPEAKER_IMAGES.filter((s) => !liveHandles.has((s.handle || "").toLowerCase()));
  // Speakers are the base layer (wall looks full); live snaps merge on top,
  // newest first so they're noticeable as they arrive.
  const images: WallImage[] = [...liveImages, ...speakers];
  const stories = slackStories && slackStories.length ? slackStories : SAMPLE_STORIES;
  return Response.json({
    images,
    stories,
    live: { images: liveImages.length > 0, stories: Boolean(slackStories && slackStories.length) },
  });
}
