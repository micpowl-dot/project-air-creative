/**
 * Path A test harness: stylize a photo into the AI Day illustrated headshot
 * look AND composite the person onto a chosen branded background, one Nano
 * Banana (Gemini image) call. Shares the engine with the live pipeline
 * (src/lib/stylize-core.ts).
 *
 *   npm run stylize -- ./selfie.jpg                         (random background)
 *   npm run stylize -- ./selfie.jpg --bg magenta-accent     (specific background)
 *   npm run stylize -- ./selfie.jpg --bg cyan ./style.png   (also custom style key)
 *
 * Needs GEMINI_API_KEY in .env.local. Optional GEMINI_IMAGE_MODEL override.
 * Writes ./stylized-output.png.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { stylize, STYLIZE_MODEL, BG_NAMES, randomBg, mimeForExt } from "../src/lib/stylize-core";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_STYLE = path.join(ROOT, "public/headshots/cutout/max-jacubowsky.png");
const BG_DIR = path.join(ROOT, "public/headshots/bg");

function envKey(): string | null {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const env = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const line = env.split("\n").find((l) => l.trim().startsWith("GEMINI_API_KEY="));
    return line ? line.slice(line.indexOf("=") + 1).trim() || null : null;
  } catch {
    return null;
  }
}

const part = (p: string) => ({ mimeType: mimeForExt(p), data: readFileSync(p).toString("base64") });

async function main() {
  const key = envKey();
  if (!key) {
    console.error("\n✗ No GEMINI_API_KEY in .env.local.\n");
    process.exit(1);
  }
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
  const bgName = bgArg === "random" ? randomBg() : bgArg;
  if (!BG_NAMES.includes(bgName)) {
    console.error(`\n✗ Unknown background "${bgName}". Options: ${BG_NAMES.join(", ")}, or "random".\n`);
    process.exit(1);
  }
  const bgPath = path.join(BG_DIR, `${bgName}.png`);
  if (!existsSync(bgPath)) {
    console.error(`\n✗ Missing ${bgPath}\n`);
    process.exit(1);
  }
  const model = process.env.GEMINI_IMAGE_MODEL || STYLIZE_MODEL;
  console.log(`→ Stylizing ${path.basename(selfie)} onto "${bgName}", style ${path.basename(style)}, via ${model}…`);

  try {
    const data = await stylize({ apiKey: key, styles: [part(style)], person: part(selfie), background: part(bgPath), model });
    const out = path.join(ROOT, "stylized-output.png");
    writeFileSync(out, Buffer.from(data, "base64"));
    console.log(`\n✓ Wrote ${out} — finished headshot on the "${bgName}" background.`);
  } catch (e) {
    console.error("\n✗", String(e));
    console.error("(If it's an auth error, the key may be the wrong type. If 503, the model is busy — retry.)");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\n✗ Failed:", e);
  process.exit(1);
});
