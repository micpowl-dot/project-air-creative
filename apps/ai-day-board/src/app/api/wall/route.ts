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

const SAMPLE_SLUGS = [
  "brennan-gerster", "brian-oneil", "dan-margulies", "dave-de-sa",
  "elizabeth-martin", "erik-petersen", "jack-kreps", "james-baker",
  "james-belanger", "javi-quinones", "lauriana-gaudet", "matthew-drooker",
  "max-jacubowsky", "miguel-gervassi", "rohit-agarwal", "rohit-nutalapati",
  "sahana-subbanna", "samantha-gates", "shannon-king", "thomas-hinson",
  "tyler-steben",
];

const SAMPLE_STORIES = [
  { name: "Sample", text: "AI helped me turn a week of manual reporting into a 5-minute workflow." },
  { name: "Sample", text: "AI helped me draft, test, and ship a client integration in one afternoon." },
  { name: "Sample", text: "AI helped me make sense of a messy spreadsheet I'd been avoiding for months." },
  { name: "Sample", text: "AI helped me prep for a tough conversation by role-playing it first." },
];

interface Story { name: string; text: string }

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
    const out: Story[] = [];
    for (const m of body.messages) {
      if (m.subtype || m.bot_id || !m.text) continue; // skip joins/bots/system
      const text = String(m.text).replace(/<[^>]+>/g, "").trim(); // strip mentions/links markup
      if (text.length < 8 || text.length > 240) continue;
      // Prefer posts that are actually "AI helped me..." style if any exist.
      out.push({ name: "", text });
    }
    const helped = out.filter((s) => /helped/i.test(s.text));
    const chosen = helped.length ? helped : out;
    return chosen.slice(0, 40).reverse();
  } catch {
    return null;
  }
}

async function imagesFromSource(): Promise<string[] | null> {
  const liveUrl = process.env.WALL_IMAGES_URL;
  if (!liveUrl) return null;
  try {
    const res = await fetch(liveUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    return Array.isArray(body.images) ? body.images : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [liveImages, slackStories] = await Promise.all([imagesFromSource(), storiesFromSlack()]);
  const images = liveImages ?? SAMPLE_SLUGS.map((s) => `/headshots/cutout/${s}.png`);
  const stories = slackStories && slackStories.length ? slackStories : SAMPLE_STORIES;
  return Response.json({
    images,
    stories,
    live: { images: Boolean(liveImages), stories: Boolean(slackStories && slackStories.length) },
  });
}
