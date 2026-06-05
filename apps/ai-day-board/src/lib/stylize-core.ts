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
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${JSON.stringify(json.error || json).slice(0, 300)}`);
  }
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data);
  if (!img) {
    const text = parts.map((p: { text?: string }) => p.text).filter(Boolean).join(" ");
    throw new Error(`No image returned. ${text.slice(0, 200)}`);
  }
  return img.inlineData.data as string;
}

export function mimeForExt(p: string): string {
  const e = p.toLowerCase().split(".").pop();
  return e === "jpg" || e === "jpeg" ? "image/jpeg" : e === "webp" ? "image/webp" : "image/png";
}
