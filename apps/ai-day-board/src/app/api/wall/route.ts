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

// Pull "AI helped me..." posts from a Slack channel and turn them into cards.
async function storiesFromSlack(): Promise<Story[] | null> {
  const token = process.env.WALL_SLACK_TOKEN;
  const channel = process.env.WALL_SLACK_CHANNEL;
  if (!token || !channel) return null;
  try {
    const res = await fetch(`https://slack.com/api/conversations.history?channel=${channel}&limit=80`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = await res.json();
    if (!body.ok || !Array.isArray(body.messages)) return null;
    const cand: { user: string; text: string }[] = [];
    for (const m of body.messages) {
      if (m.subtype || m.bot_id || !m.text) continue; // skip joins/bots/system
      const text = String(m.text).replace(/<[^>]+>/g, "").trim(); // strip mentions/links markup
      if (text.length < 8 || text.length > 240) continue;
      cand.push({ user: m.user, text });
    }
    const helped = cand.filter((s) => /helped/i.test(s.text));
    const chosen = (helped.length ? helped : cand).slice(0, 40).reverse();
    // Resolve author names (cached).
    const out: Story[] = [];
    for (const c of chosen) out.push({ name: await resolveName(c.user, token), text: c.text });
    return out;
  } catch {
    return null;
  }
}

interface WallImage { src: string; handle?: string }

// Primary: generated headshots from the Blob manifest (written by /api/process-photos).
async function imagesFromBlob(): Promise<WallImage[] | null> {
  try {
    const { readManifest } = await import("@/lib/wall-store");
    const m = await readManifest();
    if (!m || !m.images.length) return null;
    const visible = m.images.filter((i) => !i.hidden);
    if (!visible.length) return null;
    return visible.map(({ src, handle }) => ({ src, handle }));
  } catch {
    return null;
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
  // Speakers are always the base layer (wall looks full); live snaps merge on
  // top. New snaps go first so they're noticeable as they arrive.
  const images: WallImage[] = [...liveImages, ...SPEAKER_IMAGES];
  const stories = slackStories && slackStories.length ? slackStories : SAMPLE_STORIES;
  return Response.json({
    images,
    stories,
    live: { images: liveImages.length > 0, stories: Boolean(slackStories && slackStories.length) },
  });
}
