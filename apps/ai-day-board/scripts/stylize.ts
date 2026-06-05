/**
 * Path A test harness: stylize a photo into the AI Day illustrated headshot
 * look (Nano Banana / Gemini image), using an existing speaker headshot as the
 * style key. Outputs the model's image (on chroma-green) so you can eyeball the
 * style + likeness BEFORE we build the Slack/n8n pipeline.
 *
 *   npm run stylize -- ./selfie.jpg            (uses default style key)
 *   npm run stylize -- ./selfie.jpg ./style.png
 *
 * Needs GEMINI_API_KEY in .env.local. Optional GEMINI_IMAGE_MODEL to override
 * the model (default below). Writes ./stylized-output.png.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_STYLE = path.join(ROOT, "public/headshots/cutout/max-jacubowsky.png");
// Nano Banana Pro (matches Lee's output). For a cheaper pass, set
// GEMINI_IMAGE_MODEL=gemini-2.5-flash-image (standard Nano Banana).
const DEFAULT_MODEL = "gemini-3-pro-image-preview";

const PROMPT =
  "There are two images. IMAGE 1 is ONLY an art-style reference: copy its " +
  "illustration style (clean semi-realistic vector look, smooth cel-shaded " +
  "gradient shading, crisp confident linework, color finish). Do NOT copy the " +
  "face, head shape, hairstyle, or any features or identity from image 1. " +
  "IMAGE 2 is the ACTUAL PERSON to draw: keep their exact likeness, same face " +
  "shape, same head (including if bald), same hairline and hair, same facial " +
  "hair, same glasses, same skin tone, same clothing. It must clearly be the " +
  "same person as image 2, just illustrated in the style of image 1. " +
  "Head and shoulders, centered, facing forward, friendly expression. Place on " +
  "a solid flat chroma-green (#00FF00) background, no shadows or gradient, no " +
  "green color cast on hair or skin. Square 1:1.";

function envKey(): string | null {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const env = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const line = env.split("\n").find((l) => l.trim().startsWith("GEMINI_API_KEY="));
    if (!line) return null;
    return line.slice(line.indexOf("=") + 1).trim() || null;
  } catch {
    return null;
  }
}

function mimeFor(p: string): string {
  const e = p.toLowerCase().split(".").pop();
  return e === "jpg" || e === "jpeg" ? "image/jpeg" : e === "webp" ? "image/webp" : "image/png";
}
function part(p: string) {
  return { inlineData: { mimeType: mimeFor(p), data: readFileSync(p).toString("base64") } };
}

async function main() {
  const key = envKey();
  if (!key) {
    console.error("\n✗ No GEMINI_API_KEY in .env.local.\n");
    process.exit(1);
  }
  const selfie = process.argv[2];
  const style = process.argv[3] || DEFAULT_STYLE;
  if (!selfie) {
    console.error("\nUsage: npm run stylize -- ./selfie.jpg [./style.png]\n");
    process.exit(1);
  }
  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
  console.log(`→ Stylizing ${path.basename(selfie)} with style ${path.basename(style)} via ${model}…`);

  const body = {
    contents: [{ role: "user", parts: [{ text: PROMPT }, part(style), part(selfie)] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  const json = await res.json();
  if (!res.ok) {
    console.error(`\n✗ API error (${res.status}):`, JSON.stringify(json.error || json, null, 2).slice(0, 600));
    console.error("\nIf this is an auth/API-key error, the key is likely the wrong type (need an AIza... AI Studio key).");
    process.exit(1);
  }
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data);
  if (!img) {
    const text = parts.map((p: { text?: string }) => p.text).filter(Boolean).join(" ");
    console.error("\n✗ No image returned. Model said:", text || JSON.stringify(json).slice(0, 400));
    process.exit(1);
  }
  const out = path.join(ROOT, "stylized-output.png");
  writeFileSync(out, Buffer.from(img.inlineData.data, "base64"));
  console.log(`\n✓ Wrote ${out} — open it to judge the style. (It's on green; the pipeline keys that out.)`);
}

main().catch((e) => {
  console.error("\n✗ Failed:", e);
  process.exit(1);
});
