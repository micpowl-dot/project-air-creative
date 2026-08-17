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

import { viaOwnOrigin } from "@/lib/wall-store";

export const dynamic = "force-dynamic";

// Speaker / participant headshots that ALWAYS populate the wall so it looks
// full from the start. Live selfie snaps (from /snap) are merged in on top.
// NOTE: these are hardcoded, so they never appear in /wall-admin and cannot be
// hidden or removed from there. Taking someone off this layer means editing this
// list and redeploying. (Removed: sara-peal, 2026-08-03, at Michael's request.)
const SPEAKER_SLUGS = [
  "ben-papandrea", "brennan-gerster", "brian-oneil", "dan-margulies",
  "dave-de-sa", "elizabeth-martin", "erik-petersen", "jack-kreps",
  "james-baker", "james-belanger", "javi-quinones", "lauriana-gaudet",
  "matthew-drooker", "max-jacubowsky", "michelle-kilroy", "miguel-gervassi",
  "rohit-agarwal", "rohit-nutalapati", "sahana-subbanna", "samantha-gates",
  "shannon-king", "thomas-hinson", "tyler-steben",
];

const SPEAKER_IMAGES: WallImage[] = SPEAKER_SLUGS.map((s) => ({
  src: `/headshots/cutout/${s}.png`,
  handle: `@${s.replace(/-/g, ".")}`,
}));

// No placeholder quotes. There used to be four here attributed to real, named
// colleagues, which meant that whenever the live pull came up empty the wall
// showed those people saying things they had never said. On office monitors, for
// two weeks. If there are no real quotes, the wall shows no quote card at all.

interface Story { name: string; text: string }

// Resolve Slack user IDs to a display name plus whether the account is still
// active, cached on the warm instance so we only fetch each person once (the
// wall polls frequently). Quotes from deactivated accounts are dropped, matching
// how portraits of leavers are handled.
const authorCache = new Map<string, Author>();
interface Author { name: string; deleted: boolean }

async function resolveAuthor(id: string, token: string): Promise<Author> {
  if (!id) return { name: "", deleted: false };
  const hit = authorCache.get(id);
  if (hit) return hit;
  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const b = await res.json();
    // A failed lookup is NOT cached and NOT treated as deactivated. Dropping a
    // real person's quote because of a transient Slack error would be worse than
    // showing a leaver's for one more cache cycle; only a definite deleted=true
    // removes anyone.
    if (!b.ok || !b.user) return { name: "", deleted: false };
    const p = b.user.profile || {};
    const author: Author = {
      name: (p.display_name || p.real_name || b.user.real_name || "").trim(),
      deleted: Boolean(b.user.deleted),
    };
    authorCache.set(id, author);
    return author;
  } catch {
    return { name: "", deleted: false };
  }
}

// Server-side cache for the Slack-sourced quotes. The wall polls /api/wall
// frequently, but Slack's conversations.history is heavily rate-limited for
// newer apps — so we only actually call Slack every CACHE_TTL and serve the
// cached quotes (including the last-good set) in between.
let storiesCache: { at: number; stories: Story[] } | null = null;
// 90s, up from 30s. Restricted-tier apps get roughly one history call a minute,
// and a 30s TTL meant two, which risks 429s and losing the quotes to a throttle.
const STORIES_TTL = 90 * 1000;

// Slack returns emoji as :shortcodes: in message text (picker emoji come
// through as real unicode and need no help). Convert the common ones to unicode
// so the wall shows the emoji; drop unrecognized/custom shortcodes (workspace
// emoji we can't render) so there are no leftover ":colon:" tokens.
const EMOJI: Record<string, string> = {
  smile: "😄", smiley: "😃", grinning: "😀", grin: "😁", joy: "😂", rofl: "🤣", rolling_on_the_floor_laughing: "🤣",
  sweat_smile: "😅", laughing: "😆", blush: "😊", slightly_smiling_face: "🙂", upside_down_face: "🙃",
  wink: "😉", sunglasses: "😎", smirk: "😏", thinking: "🤔", thinking_face: "🤔", exploding_head: "🤯",
  star_struck: "🤩", partying_face: "🥳", tada: "🎉", confetti_ball: "🎊", nerd_face: "🤓", face_with_monocle: "🧐",
  heart_eyes: "😍", relieved: "😌", grimacing: "😬", sweat: "😓", flushed: "😳", eyes: "👀",
  raised_hands: "🙌", clap: "👏", pray: "🙏", muscle: "💪", ok_hand: "👌", wave: "👋", point_up: "☝️",
  raised_hand: "✋", handshake: "🤝", "+1": "👍", thumbsup: "👍", "-1": "👎", thumbsdown: "👎", v: "✌️", crossed_fingers: "🤞",
  rocket: "🚀", fire: "🔥", sparkles: "✨", star: "⭐", star2: "🌟", zap: "⚡", boom: "💥", "100": "💯",
  bulb: "💡", brain: "🧠", robot_face: "🤖", robot: "🤖", computer: "💻", keyboard: "⌨️", gear: "⚙️",
  mag: "🔍", dart: "🎯", trophy: "🏆", chart_with_upwards_trend: "📈", bar_chart: "📊", clipboard: "📋",
  memo: "📝", pencil: "✏️", white_check_mark: "✅", heavy_check_mark: "✔️", checkered_flag: "🏁",
  hourglass: "⌛", hourglass_flowing_sand: "⏳", alarm_clock: "⏰", stopwatch: "⏱️", clap_tone: "👏",
  heart: "❤️", sparkling_heart: "💖", two_hearts: "💕", blue_heart: "💙", green_heart: "💚", yellow_heart: "💛",
  purple_heart: "💜", tada2: "🎉", magic_wand: "🪄", crystal_ball: "🔮", coffee: "☕", saluting_face: "🫡",
  pinched_fingers: "🤌", mind_blown: "🤯", sob: "😭", smiling_face_with_tear: "🥲", cry: "😢", grinning_face: "😀",
  raising_hands: "🙌", fire_engine: "🚒", chart: "📈", check: "✅",
};
function emojify(text: string): string {
  return text.replace(/:([a-z0-9_'+-]+):/gi, (_m, name: string) => EMOJI[name.toLowerCase()] ?? "");
}

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
    // Reads 200, not 15. At 15 the window only covered the newest handful of
    // posts, and the channel has drifted to general AI chat, so every real
    // "AI helped me…" statement — 31 of them, from AI Day itself — sat outside
    // the window and the wall never saw one. Verified this token returns 200 per
    // call. Paired with a longer cache TTL below to stay inside the rate limit.
    const res = await fetch(`https://slack.com/api/conversations.history?channel=${channel}&limit=200`, {
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
      const text = emojify(
        String(m.text)
          .replace(/<[^>]+>/g, "")    // strip mentions/links markup
          .replace(/\[[^\]]*\]/g, "") // strip [bracketed notes] meant for chat readers, not the wall
      )
        // Slack sends text HTML-escaped and people use *bold*. Both render
        // literally on a wall, so a real quote came out as "AI helped me &amp;
        // the TWC Comms Team…" with the entity visible. Formatting only: the
        // person's words are never changed.
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/[*_]+/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (text.length < 8 || text.length > 240) continue;
      cand.push({ user: m.user, text });
    }
    // Only real testimonials: contains "helped" (the prompted phrasing) or
    // starts with "AI ...". Never fall back to arbitrary channel chatter — if
    // there are no matches the wall shows no quote card at all.
    const helped = cand.filter((s) => /helped/i.test(s.text) || /^ai\b/i.test(s.text.trim()));
    const chosen = helped.slice(0, 40).reverse();
    // Resolve author names (cached).
    const out: Story[] = [];
    for (const c of chosen) {
      const author = await resolveAuthor(c.user, token);
      if (author.deleted) continue; // no longer with the company
      out.push({ name: author.name, text: c.text });
    }
    storiesCache = { at: Date.now(), stories: out };
    return out.length ? out : null;
  } catch {
    return storiesCache?.stories.length ? storiesCache.stories : null;
  }
}

interface WallImage { src: string; handle?: string; flip?: boolean }

// Primary: generated headshots from the Blob manifest (written by /api/process-photos).
// Cache the manifest-derived images. The wall polls every ~8s and reads the
// manifest from the GitHub API — without this, that burns the GitHub rate
// limit fast (especially with multiple screens open). 15s keeps GitHub reads
// modest while letting /wall-admin hide/show changes show up quickly.
let imagesCache: { at: number; images: WallImage[] } | null = null;
const IMAGES_TTL = 15 * 1000;

async function imagesFromBlob(): Promise<WallImage[] | null> {
  if (imagesCache && Date.now() - imagesCache.at < IMAGES_TTL) {
    return imagesCache.images.length ? imagesCache.images : null;
  }
  try {
    const { readManifest } = await import("@/lib/wall-store");
    const m = await readManifest();
    if (!m || !m.images.length) return imagesCache?.images.length ? imagesCache.images : null;
    const visible = m.images.filter((i) => !i.hidden).map(({ src, handle, flip }) => ({ src, handle, flip }));
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
  const images: WallImage[] = [...liveImages, ...speakers].map((i) => ({ ...i, src: viaOwnOrigin(String(i.src)) }));
  // Fails closed: empty means the wall simply renders no quote card.
  const stories = slackStories ?? [];
  return Response.json({
    images,
    stories,
    live: { images: liveImages.length > 0, stories: Boolean(slackStories && slackStories.length) },
  });
}
