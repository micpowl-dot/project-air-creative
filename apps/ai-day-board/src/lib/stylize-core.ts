// Shared Path A stylizer: turn a real photo into the AI Day illustrated headshot
// look AND composite it onto a branded background in one Nano Banana (Gemini
// image) call. Used by the local harness (scripts/stylize.ts) and the live
// pipeline (/api/process-photos).

export const STYLIZE_MODEL = "gemini-3-pro-image-preview"; // Nano Banana Pro (best likeness)
export const STANDARD_MODEL = "gemini-2.5-flash-image"; // standard Nano Banana — fallback when Pro is down

export const BG_NAMES = [
  "magenta", "magenta-accent", "cyan", "cyan-accent", "violet",
  "violet-accent", "amber", "amber-accent", "forest", "forest-accent",
];

export function randomBg(): string {
  return BG_NAMES[Math.floor(Math.random() * BG_NAMES.length)];
}

// No image style references. Feeding the model ANY real person's photo as a
// "style" exemplar causes identity bleed (subjects came out looking like the
// reference, e.g. Max). The style is described in TEXT instead, so the ONLY
// face the model ever sees is the actual person's selfie — nothing to copy.
export const STYLE_REFS: string[] = [];

export const STYLIZE_PROMPT =
  "There are two images. The FIRST image is the ACTUAL PERSON. Redraw this exact " +
  "person as a polished illustrated portrait in THIS style: a clean semi-realistic " +
  "vector illustration with smooth cel-shaded gradient shading, crisp confident " +
  "linework, full saturated color, and a warm, friendly look (like a high-quality " +
  "digital illustration of the person). " +
  "Preserve their likeness EXACTLY — the SAME apparent gender/sex, the same age, " +
  "the same ethnicity and skin tone, and the same face shape, head and hairline, " +
  "hairstyle, facial hair, glasses, and clothing as in the photo. Do NOT change " +
  "their gender, age, ethnicity, or features, do NOT make them more masculine or " +
  "more feminine, and NEVER substitute anyone else's face. It must be immediately " +
  "and unmistakably the same individual as the first image. " +
  "The SECOND image is the BACKGROUND: place the illustrated person directly in " +
  "front of it and keep its colors and pattern exactly as-is — do not alter, " +
  "restyle, recolor, or add anything to the background. " +
  "FRAMING (identical crop every time, regardless of the input photo's zoom): " +
  "a head-and-shoulders portrait where the top of the head sits just inside the " +
  "top edge with a small margin above it, the face is centered in the " +
  "upper-middle, and BOTH shoulders and the upper chest are fully visible across " +
  "the bottom. Never crop the shoulders, never zoom tighter than the upper chest, " +
  "never leave large empty headroom. " +
  "Centered, facing forward, friendly expression. Square 1:1. " +
  "MOST IMPORTANT: the result must be unmistakably the same person as the first " +
  "image. If the art style and the person's true likeness ever conflict, always " +
  "preserve the likeness.";

export interface ImgPart {
  mimeType: string;
  data: string; // base64
}

/**
 * Run the stylization. Returns base64 PNG data of the finished headshot.
 * `styles` is one or more style references (different people, same style).
 * Throws on API error or if no image came back.
 */
export async function stylize(opts: {
  apiKey: string;
  styles: ImgPart[];
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
          ...opts.styles.map((s) => ({ inlineData: s })),
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
    // 429 = rate/quota cap. Retrying it immediately just burns more of the
    // quota for nothing, so fail fast and let the caller back off. 503/500 are
    // transient overload — worth a quick retry.
    const retriable = res.status === 503 || res.status === 500;
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
