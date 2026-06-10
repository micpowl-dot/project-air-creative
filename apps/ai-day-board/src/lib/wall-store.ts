// Wall feed storage via GitHub API. Generated headshots are committed to:
//   apps/ai-day-board/public/wall-generated/<ts>.png
// and served from raw.githubusercontent.com (public, no auth needed to read).
// A manifest JSON at the same path lists every image + handle.
//
// Needs env: GITHUB_TOKEN (PAT with Contents: write on the repo),
//            GITHUB_REPO  (e.g. "micpowl-dot/project-air-creative")
//            GITHUB_BRANCH (default: "ai-day-board-v1")

export interface WallImage {
  src: string;
  handle?: string;
  ts?: string;
  hidden?: boolean; // moderated off the wall (reversible) via /wall-admin
  flip?: boolean;   // mirror (horizontal flip) the portrait on the wall, via /wall-admin
  srcUrl?: string;  // Slack url_private of the original selfie (admin-only QA; never public)
  model?: "pro" | "flash"; // which Gemini model rendered it (flash = Pro-outage fallback)
}
export interface WallManifest {
  lastTs: string;
  images: WallImage[];
  attempts?: Record<string, number>; // per-message stylize retry counter (cron)
  rendered?: { pro: number; flash: number }; // lifetime render tally (survives the 400-image cap)
  cooldownUntil?: number; // epoch ms; after a 429/quota cap, skip runs until then to stop burning quota
  paused?: boolean; // when true, /snap shows a "back shortly" overlay (toggled from /wall-admin)
  sentPortraits?: string[]; // Slack user ids already DMed their portrait (idempotent batch send)
}

const REPO    = () => process.env.GITHUB_REPO   || "micpowl-dot/project-air-creative";
const BRANCH  = () => process.env.GITHUB_BRANCH || "ai-day-board-v1";
const TOKEN   = () => process.env.GITHUB_TOKEN;
const BASE    = "apps/ai-day-board/public/wall-generated";
const MANIFEST_PATH = `${BASE}/manifest.json`;

const RAW = (path: string) =>
  `https://raw.githubusercontent.com/${REPO()}/${BRANCH()}/${path}?t=${Date.now()}`;

function headers() {
  return {
    Authorization: `Bearer ${TOKEN()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** Get the SHA of an existing file (needed to update it). */
async function getSha(path: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO()}/contents/${path}?ref=${BRANCH()}`,
    { headers: headers(), cache: "no-store" }
  );
  if (res.status === 404) return null;
  const j = await res.json();
  return j.sha ?? null;
}

/** Commit a file (create or update). content = base64 string. */
async function commitFile(path: string, content: string, message: string): Promise<void> {
  const sha = await getSha(path);
  const body: Record<string, unknown> = { message, content, branch: BRANCH() };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${REPO()}/contents/${path}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(`GitHub commit failed (${res.status}): ${JSON.stringify(e).slice(0, 200)}`);
  }
}

export async function readManifest(): Promise<WallManifest | null> {
  try {
    // Read via the authenticated Contents API (fresh, not CDN-cached like raw).
    const res = await fetch(
      `https://api.github.com/repos/${REPO()}/contents/${MANIFEST_PATH}?ref=${BRANCH()}&t=${Date.now()}`,
      { headers: headers(), cache: "no-store" }
    );
    if (!res.ok) return null;
    const j = await res.json();
    if (!j.content) return null;
    return JSON.parse(Buffer.from(j.content, "base64").toString("utf8")) as WallManifest;
  } catch {
    return null;
  }
}

export async function writeManifest(m: WallManifest): Promise<void> {
  const content = Buffer.from(JSON.stringify(m, null, 2)).toString("base64");
  await commitFile(MANIFEST_PATH, content, "chore: update wall manifest [skip ci]");
}

/** Show/hide an image on the wall (matched by ts). Returns the updated manifest. */
export async function setHidden(ts: string, hidden: boolean): Promise<WallManifest | null> {
  const m = await readManifest();
  if (!m) return null;
  const img = m.images.find((i) => i.ts === ts);
  if (!img) return m;
  img.hidden = hidden;
  await writeManifest(m);
  return m;
}

/** Pause/resume the /snap photo booth (shows a "back shortly" overlay). */
export async function setPaused(paused: boolean): Promise<WallManifest | null> {
  const m = await readManifest();
  if (!m) return null;
  m.paused = paused;
  await writeManifest(m);
  return m;
}

/** Set/replace the person's handle (caption) on an image, e.g. to claim an
 *  anonymous snap for a real person. Pass "" to clear it. */
export async function setHandle(ts: string, handle: string): Promise<WallManifest | null> {
  const m = await readManifest();
  if (!m) return null;
  const img = m.images.find((i) => i.ts === ts);
  if (!img) return m;
  img.handle = handle;
  await writeManifest(m);
  return m;
}

/** Mirror (horizontal flip) an image on the wall (matched by ts). Reversible. */
export async function setFlip(ts: string, flip: boolean): Promise<WallManifest | null> {
  const m = await readManifest();
  if (!m) return null;
  const img = m.images.find((i) => i.ts === ts);
  if (!img) return m;
  img.flip = flip;
  await writeManifest(m);
  return m;
}

/** Remove an image's MANIFEST entry (matched by ts). The PNG file is left in
 *  the repo, so it becomes "orphaned" and can be re-added later — this just
 *  takes it out of the wall + the /wall-admin gallery. */
export async function removeImage(ts: string): Promise<WallManifest | null> {
  const m = await readManifest();
  if (!m) return null;
  const before = m.images.length;
  m.images = m.images.filter((i) => i.ts !== ts);
  if (m.images.length !== before) await writeManifest(m);
  return m;
}

/** Store a generated headshot PNG; returns its public raw.githubusercontent URL. */
export async function putImage(name: string, buf: Buffer): Promise<string> {
  const path = `${BASE}/${name}.png`;
  await commitFile(path, buf.toString("base64"), `chore: add wall headshot ${name} [skip ci]`);
  return `https://raw.githubusercontent.com/${REPO()}/${BRANCH()}/${path}`;
}
