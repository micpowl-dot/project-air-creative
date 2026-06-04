// Image + story feed for the "AI Helped Me..." live wall (/wall).
// The wall polls this every few seconds and adds new tiles as they arrive.
//
// SOURCE (today): a sample set so the display works end-to-end now.
// SOURCE (live): set WALL_IMAGES_URL to a JSON endpoint that returns
//   { "images": ["https://.../photo1.jpg", ...] } — e.g. an n8n workflow that
//   watches the Drive intake folder and publishes the list. When that env var
//   is present we use it; otherwise we fall back to the sample set below.

export const dynamic = "force-dynamic";

// Sample tiles so the wall is populated for the June 6 test. These reuse the
// branded headshot cutouts as stand-in "photos"; real uploads replace them.
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

export async function GET() {
  const liveUrl = process.env.WALL_IMAGES_URL;
  if (liveUrl) {
    try {
      const res = await fetch(liveUrl, { cache: "no-store" });
      if (res.ok) {
        const body = await res.json();
        if (Array.isArray(body.images)) {
          return Response.json({ images: body.images, stories: body.stories ?? SAMPLE_STORIES, live: true });
        }
      }
    } catch {
      /* fall through to sample set */
    }
  }
  const images = SAMPLE_SLUGS.map((s) => `/headshots/cutout/${s}.png`);
  return Response.json({ images, stories: SAMPLE_STORIES, live: false });
}
