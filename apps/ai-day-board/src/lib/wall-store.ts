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
}
export interface WallManifest {
  lastTs: string;
  images: WallImage[];
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
    const res = await fetch(RAW(MANIFEST_PATH), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as WallManifest;
  } catch {
    return null;
  }
}

export async function writeManifest(m: WallManifest): Promise<void> {
  const content = Buffer.from(JSON.stringify(m, null, 2)).toString("base64");
  await commitFile(MANIFEST_PATH, content, "chore: update wall manifest [skip ci]");
}

/** Store a generated headshot PNG; returns its public raw.githubusercontent URL. */
export async function putImage(name: string, buf: Buffer): Promise<string> {
  const path = `${BASE}/${name}.png`;
  await commitFile(path, buf.toString("base64"), `chore: add wall headshot ${name} [skip ci]`);
  return `https://raw.githubusercontent.com/${REPO()}/${BRANCH()}/${path}`;
}
