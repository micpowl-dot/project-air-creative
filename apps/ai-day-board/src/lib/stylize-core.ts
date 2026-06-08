// Shared Path A stylizer: turn a real photo into the AI Day illustrated headshot
// look AND composite it onto a branded background in one Nano Banana (Gemini
// image) call. Used by the local harness (scripts/stylize.ts) and the live
// pipeline (/api/process-photos).

export const STYLIZE_MODEL = "gemini-3-pro-image-preview"; // Nano Banana Pro

export const BG_NAMES = [
  "magenta", "magenta-accent", "cyan", "cyan-accent", "violet",
  "violet-accent", "amber", "amber-accent", "forest", "forest-accent",
];

export function randomBg(): string {
  return BG_NAMES[Math.floor(Math.random() * BG_NAMES.length)];
}

export const STYLIZE_PROMPT =
  "There are three images. IMAGE 1 is ONLY an art-style reference: copy its " +
  "illustration style (clean semi-realistic vector look, smooth cel-shaded " +
  "gradient shading, crisp confident linework, full color). Do NOT copy the " +
  "face, hair, or identity from image 1. IMAGE 2 is the ACTUAL PERSON to draw: " +
  "keep their exact likeness — same face shape, head and hairline, facial hair, " +
  "glasses, skin tone, and clothing. It must clearly be the same person as " +
  "image 2. IMAGE 3 is the BACKGROUND: place the illustrated person directly in " +
  "front of this exact background as a head-and-shoulders portrait filling a " +
  "square frame. Keep image 3's colors and pattern exactly as-is behind the " +
  "person — do not alter, restyle, recolor, or add anything to the background. " +
  "Centered, facing forward, friendly expression. Square 1:1.";

export interface ImgPart {
  mimeType: string;
  data: string; // base64
}

/**
 * Run the stylization. Returns base64 PNG data of the finished headshot.
 * Throws on API error or if no image came back.
 */
export async function stylize(opts: {
  apiKey: string;
  style: ImgPart;
  person: ImgPart;
  background: ImgPart;
  model?: string;
}): Promise<string> {
  const model = opts.model || STYLIZE_MODEL;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: STYLIZE_PROMPT },
          { inlineData: opts.style },
          { inlineData: opts.person },
          { inlineData: opts.background },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"] },
  };
  // Gemini image (Nano Banana Pro) gets transient 503/429s under load. Retry
  // a few times with backoff so a momentary spike doesn't drop a snap.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.apiKey}`;
  const MAX_TRIES = 3;
  let json: { error?: unknown; candidates?: Array<{ content?: { parts?: Array<{ text?: string; inlineData?: { data: string } }> } }> } = {};
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    json = await res.json();
    if (res.ok) break;
    const retriable = res.status === 503 || res.status === 429 || res.status === 500;
    if (!retriable || attempt === MAX_TRIES) {
      throw new Error(`Gemini ${res.status}: ${JSON.stringify(json.error || json).slice(0, 300)}`);
    }
    await new Promise((r) => setTimeout(r, attempt * 2000)); // 2s, 4s backoff
  }
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const data = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!data) {
    const text = parts.map((p) => p.text).filter(Boolean).join(" ");
    throw new Error(`No image returned. ${text.slice(0, 200)}`);
  }
  return data;
}

export function mimeForExt(p: string): string {
  const e = p.toLowerCase().split(".").pop();
  return e === "jpg" || e === "jpeg" ? "image/jpeg" : e === "webp" ? "image/webp" : "image/png";
}
