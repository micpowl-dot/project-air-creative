/**
 * Path A test harness: stylize a photo into the AI Day illustrated headshot
 * look (Nano Banana / Gemini image) AND composite the person onto a chosen
 * branded background in one generation — no chroma key, no matting.
 *
 *   npm run stylize -- ./selfie.jpg                         (random background)
 *   npm run stylize -- ./selfie.jpg --bg magenta-accent     (specific background)
 *   npm run stylize -- ./selfie.jpg --bg cyan ./style.png   (also custom style key)
 *
 * Backgrounds = the names in public/headshots/bg/ (magenta, magenta-accent,
 * cyan, cyan-accent, violet, violet-accent, amber, amber-accent, forest,
 * forest-accent), or "random". Needs GEMINI_API_KEY in .env.local. Optional
 * GEMINI_IMAGE_MODEL override. Writes ./stylized-output.png.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_STYLE = path.join(ROOT, "public/headshots/cutout/max-jacubowsky.png");
const BG_DIR = path.join(ROOT, "public/headshots/bg");
// Nano Banana Pro (matches Lee's output). For a cheaper pass, set
// GEMINI_IMAGE_MODEL=gemini-2.5-flash-image (standard Nano Banana).
const DEFAULT_MODEL = "gemini-3-pro-image-preview";

const PROMPT =
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
  // Parse args: [selfie] [style?] with an optional `--bg <name|random>`.
  const argv = process.argv.slice(2);
  let bgArg = "random";
  const bi = argv.indexOf("--bg");
  if (bi >= 0) {
    bgArg = argv[bi + 1] || "random";
    argv.splice(bi, 2);
  }
  const selfie = argv[0];
  const style = argv[1] || DEFAULT_STYLE;
  if (!selfie) {
    console.error("\nUsage: npm run stylize -- ./selfie.jpg [--bg <name|random>] [./style.png]\n");
    process.exit(1);
  }

  // Resolve the background image.
  const bgNames = readdirSync(BG_DIR).filter((f) => f.endsWith(".png")).map((f) => f.replace(/\.png$/, ""));
  const bgName = bgArg === "random" ? bgNames[Math.floor(Math.random() * bgNames.length)] : bgArg;
  const bgPath = path.join(BG_DIR, `${bgName}.png`);
  if (!existsSync(bgPath)) {
    console.error(`\n✗ Unknown background "${bgName}". Options: ${bgNames.join(", ")}, or "random".\n`);
    process.exit(1);
  }

  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
  console.log(`→ Stylizing ${path.basename(selfie)} onto "${bgName}" background, style ${path.basename(style)}, via ${model}…`);

  const body = {
    contents: [{ role: "user", parts: [{ text: PROMPT }, part(style), part(selfie), part(bgPath)] }],
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
  console.log(`\n✓ Wrote ${out} — finished headshot on the "${bgName}" background, no keying needed.`);
}

main().catch((e) => {
  console.error("\n✗ Failed:", e);
  process.exit(1);
});
